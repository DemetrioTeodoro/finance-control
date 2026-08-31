import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import {
  getCreditCardInvoice,
  shiftInvoiceCycle,
  type InvoiceCycleKey,
} from "@/services/credit-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SensitiveValue } from "@/components/sensitive-value";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type FaturaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const longDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthLabel = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function parseCycle(
  yearParam?: string,
  monthParam?: string,
): InvoiceCycleKey | undefined {
  const year = Number(yearParam);
  const month = Number(monthParam);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return undefined;
  }

  return { year, month: month - 1 };
}

export default async function FaturaPage({
  params,
  searchParams,
}: FaturaPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { id } = await params;
  const query = await searchParams;
  const cycle = parseCycle(query.year, query.month);

  let invoice;

  try {
    invoice = await getCreditCardInvoice({
      userId: session.user.id,
      creditCardId: id,
      cycle,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CREDIT_CARD_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const previousCycle = shiftInvoiceCycle(invoice.cycle, -1);
  const nextCycle = shiftInvoiceCycle(invoice.cycle, 1);

  function cycleHref(target: InvoiceCycleKey) {
    return `/cartoes/${id}/fatura?year=${target.year}&month=${target.month + 1}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/cartoes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Cartões
        </Link>

        <h1 className="mt-2 text-3xl font-bold">{invoice.creditCard.name}</h1>

        <p className="text-muted-foreground">
          Fatura de{" "}
          {monthLabel.format(
            new Date(invoice.cycle.year, invoice.cycle.month, 1),
          )}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {invoice.isCurrent ? "Fatura atual" : "Fatura"}
            </CardTitle>

            <p className="text-xs text-muted-foreground">
              Período: {longDate.format(invoice.periodStart)} a{" "}
              {longDate.format(invoice.periodEnd)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={cycleHref(previousCycle)}
              aria-label="Fatura anterior"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
              )}
            >
              <ChevronLeft />
            </Link>

            <Link
              href={cycleHref(nextCycle)}
              aria-label="Próxima fatura"
              aria-disabled={invoice.isCurrent}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                invoice.isCurrent && "pointer-events-none opacity-50",
              )}
            >
              <ChevronRight />
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">
            <SensitiveValue>{currency.format(invoice.total)}</SensitiveValue>
          </p>

          <p className="text-sm text-muted-foreground">
            Vence em {longDate.format(invoice.dueDate)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Transações da fatura
          </CardTitle>
        </CardHeader>

        <CardContent>
          {invoice.transactions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma transação nesta fatura.
            </p>
          ) : (
            <div className="space-y-3">
              {invoice.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {transaction.description}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {transaction.category?.name ?? "Sem categoria"} ·{" "}
                      {longDate.format(transaction.date)}
                    </p>
                  </div>

                  <SensitiveValue className="shrink-0 whitespace-nowrap font-semibold text-red-500">
                    {currency.format(transaction.amount)}
                  </SensitiveValue>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
