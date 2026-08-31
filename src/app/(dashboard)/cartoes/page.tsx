import Link from "next/link";

import { auth } from "@/auth";
import { getCreditCardInvoice, getCreditCards } from "@/services/credit-card";
import { SensitiveValue } from "@/components/sensitive-value";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCardForm } from "./credit-card-form";
import { CreditCardEditButton } from "./credit-card-edit-button";
import { CreditCardDeleteButton } from "./credit-card-delete-button";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

export default async function CreditCardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const creditCards = await getCreditCards(userId);

  const invoices = await Promise.all(
    creditCards.map((creditCard) =>
      getCreditCardInvoice({ userId, creditCardId: creditCard.id }),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cartões</h1>

          <p className="text-muted-foreground">
            Gerencie seus cartões de crédito
          </p>
        </div>

        <CreditCardForm />
      </div>

      {creditCards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui nenhum cartão.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map((creditCard, index) => {
            const invoice = invoices[index];

            return (
              <div
                key={creditCard.id}
                className="rounded-lg border bg-card p-6"
              >
                <h2 className="font-semibold">{creditCard.name}</h2>

                <p className="text-sm text-muted-foreground">
                  Fecha dia {creditCard.closingDay} · Vence dia{" "}
                  {creditCard.dueDay}
                </p>

                <p className="mt-4 text-2xl font-bold">
                  {creditCard.limit !== null ? (
                    <SensitiveValue>
                      {currency.format(Number(creditCard.limit))}
                    </SensitiveValue>
                  ) : (
                    "Sem limite definido"
                  )}
                </p>

                <p className="text-xs text-muted-foreground">Limite</p>

                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <p className="text-lg font-semibold">
                    <SensitiveValue>
                      {currency.format(invoice.total)}
                    </SensitiveValue>
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Fatura atual · fecha {shortDate.format(invoice.periodEnd)}{" "}
                    · vence {shortDate.format(invoice.dueDate)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/cartoes/${creditCard.id}/fatura`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Ver fatura
                  </Link>

                  <CreditCardEditButton
                    creditCard={{
                      id: creditCard.id,
                      name: creditCard.name,
                      limit:
                        creditCard.limit !== null
                          ? Number(creditCard.limit)
                          : null,
                      closingDay: creditCard.closingDay,
                      dueDay: creditCard.dueDay,
                    }}
                  />

                  <CreditCardDeleteButton
                    creditCard={{
                      id: creditCard.id,
                      name: creditCard.name,
                    }}
                    hasTransactions={creditCard.transactionCount > 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
