import { auth } from "@/auth";
import { getCreditCards } from "@/services/credit-card";
import { CreditCardForm } from "./credit-card-form";
import { CreditCardEditButton } from "./credit-card-edit-button";
import { CreditCardDeleteButton } from "./credit-card-delete-button";

export const dynamic = "force-dynamic";

export default async function CreditCardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const creditCards = await getCreditCards(session.user.id);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

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
          {creditCards.map((creditCard) => (
            <div key={creditCard.id} className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold">{creditCard.name}</h2>

              <p className="text-sm text-muted-foreground">
                Fecha dia {creditCard.closingDay} · Vence dia{" "}
                {creditCard.dueDay}
              </p>

              <p className="mt-4 text-2xl font-bold">
                {creditCard.limit !== null
                  ? currency.format(Number(creditCard.limit))
                  : "Sem limite definido"}
              </p>

              <div className="mt-4 flex gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
