import { auth } from "@/auth";
import { getRecurringBillsWithStatus } from "@/services/recurring-bill";
import { getCategoryOptions } from "@/services/category";
import { RecurringBillForm } from "./recurring-bill-form";
import { RecurringBillEditButton } from "./recurring-bill-edit-button";
import { RecurringBillDeleteButton } from "./recurring-bill-delete-button";
import { RecurringBillConfirmButton } from "./recurring-bill-confirm-button";
import { SensitiveValue } from "@/components/sensitive-value";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const monthLabel = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export default async function RecurringBillsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const now = new Date();
  const reference = { year: now.getFullYear(), month: now.getMonth() };

  const [recurringBills, categories] = await Promise.all([
    getRecurringBillsWithStatus(userId, reference),
    getCategoryOptions(userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas fixas</h1>

          <p className="text-muted-foreground">
            Checklist de {monthLabel.format(now)} — acompanhe se as contas
            fixas do mês já foram pagas
          </p>
        </div>

        <RecurringBillForm categories={categories} />
      </div>

      {recurringBills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui nenhuma conta fixa cadastrada.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recurringBills.map((bill) => (
            <div key={bill.id} className="rounded-lg border bg-card p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{bill.name}</h2>

                  <p className="text-sm text-muted-foreground">
                    Vence dia {bill.dueDay}
                    {!bill.active && " · inativa"}
                  </p>
                </div>

                {bill.paid ? (
                  <Badge variant="secondary">Pago</Badge>
                ) : (
                  <Badge variant="destructive">Pendente</Badge>
                )}
              </div>

              {bill.category && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: bill.category.color ?? "#999" }}
                  />
                  {bill.category.name}
                </div>
              )}

              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-semibold">
                  {bill.expectedAmount !== null ? (
                    <SensitiveValue>
                      {currency.format(bill.expectedAmount)}
                    </SensitiveValue>
                  ) : (
                    "Valor não definido"
                  )}
                </p>

                <p className="text-xs text-muted-foreground">
                  Vencimento em {shortDate.format(bill.dueDate)}
                  {bill.paid && bill.confirmedAutomatically
                    ? " · identificada automaticamente"
                    : bill.paid
                      ? " · confirmada manualmente"
                      : ""}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <RecurringBillConfirmButton
                  recurringBillId={bill.id}
                  year={reference.year}
                  month={reference.month}
                  paid={bill.paid}
                />

                <RecurringBillEditButton
                  recurringBill={{
                    id: bill.id,
                    name: bill.name,
                    expectedAmount: bill.expectedAmount,
                    dueDay: bill.dueDay,
                    active: bill.active,
                    categoryId: bill.category?.id ?? null,
                  }}
                  categories={categories}
                />

                <RecurringBillDeleteButton
                  recurringBill={{ id: bill.id, name: bill.name }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
