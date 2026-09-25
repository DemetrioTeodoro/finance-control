import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { parseLocalDate } from "@/lib/date";
import {
  bulkCreateAccountTransactions,
  bulkCreateCreditCardTransactions,
} from "@/services/transaction";

type BulkTransactionPayloadItem = {
  descricao?: unknown;
  valor?: unknown;
  tipo?: unknown;
  data?: unknown;
  idExterno?: unknown;
};

type BulkTransactionPayload = {
  creditCardId?: unknown;
  accountId?: unknown;
  transacoes?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: BulkTransactionPayload;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const creditCardId =
    typeof body.creditCardId === "string" ? body.creditCardId.trim() : "";
  const accountId =
    typeof body.accountId === "string" ? body.accountId.trim() : "";

  if (creditCardId && accountId) {
    return Response.json(
      { error: "Informe apenas um cartão ou uma conta, não os dois." },
      { status: 400 },
    );
  }

  if (!creditCardId && !accountId) {
    return Response.json(
      { error: "Cartão ou conta não informado." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.transacoes) || body.transacoes.length === 0) {
    return Response.json(
      { error: "Nenhuma transação informada." },
      { status: 400 },
    );
  }

  let items: {
    description: string;
    amount: number;
    type: "income" | "expense";
    date: Date;
    externalId: string | null;
  }[];

  try {
    items = (body.transacoes as BulkTransactionPayloadItem[]).map((item) => {
      if (
        typeof item.descricao !== "string" ||
        typeof item.valor !== "number" ||
        (item.tipo !== "income" && item.tipo !== "expense") ||
        typeof item.data !== "string" ||
        (item.idExterno != null && typeof item.idExterno !== "string")
      ) {
        throw new Error("INVALID_TRANSACTION_ITEM");
      }

      return {
        description: item.descricao,
        amount: item.valor,
        type: item.tipo,
        date: parseLocalDate(item.data),
        externalId: item.idExterno ?? null,
      };
    });
  } catch {
    return Response.json(
      { error: "Uma ou mais transações estão em formato inválido." },
      { status: 400 },
    );
  }

  try {
    const result = accountId
      ? await bulkCreateAccountTransactions({
          userId: session.user.id,
          accountId,
          items,
        })
      : await bulkCreateCreditCardTransactions({
          userId: session.user.id,
          creditCardId,
          items,
        });

    return Response.json({ count: result.count, skipped: result.skipped });
  } catch (error) {
    // Índice único de externalId violado: outro import do mesmo arquivo
    // gravou as transações entre a checagem de duplicatas e o insert.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Essas transações já estão sendo importadas." },
        { status: 409 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "CREDIT_CARD_NOT_FOUND") {
        return Response.json(
          { error: "Cartão não encontrado." },
          { status: 404 },
        );
      }

      if (error.message === "ACCOUNT_NOT_FOUND") {
        return Response.json(
          { error: "Conta não encontrada." },
          { status: 404 },
        );
      }

      if (
        error.message === "INVALID_DESCRIPTION" ||
        error.message === "INVALID_AMOUNT" ||
        error.message === "INVALID_TYPE" ||
        error.message === "INVALID_DATE" ||
        error.message === "EMPTY_TRANSACTION_LIST"
      ) {
        return Response.json(
          { error: "Dados de transação inválidos." },
          { status: 400 },
        );
      }
    }

    return Response.json(
      { error: "Não foi possível salvar as transações." },
      { status: 500 },
    );
  }
}
