import { auth } from "@/auth";
import {
  getRecurringBillsWithHistory,
  getExpenseTransactionOptionsByMonth,
  resolveRecurringBillPeriod,
  resolveRecurringBillMonths,
} from "@/services/recurring-bill";
import { getCategoryOptions } from "@/services/category";
import { RecurringBillForm } from "./recurring-bill-form";
import { RecurringBillEditButton } from "./recurring-bill-edit-button";
import { RecurringBillDeleteButton } from "./recurring-bill-delete-button";
import { RecurringBillMonthCell } from "./recurring-bill-month-cell";
import { RecurringBillPeriodFilter } from "./recurring-bill-period-filter";
import { SensitiveValue } from "@/components/sensitive-value";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]}/${String(year).slice(-2)}`;
}

function toIsoDate(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

type RecurringBillsPageProps = {
  searchParams: Promise<{
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function RecurringBillsPage({
  searchParams,
}: RecurringBillsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const params = await searchParams;
  const period = resolveRecurringBillPeriod(params.period);
  const months = resolveRecurringBillMonths(
    period,
    params.startDate,
    params.endDate,
  );

  const [{ bills }, categories] = await Promise.all([
    getRecurringBillsWithHistory(userId, months),
    getCategoryOptions(userId),
  ]);

  const transactionOptionsByMonth = await getExpenseTransactionOptionsByMonth(
    userId,
    months,
  );

  const defaultStartDate =
    params.startDate ?? toIsoDate(months[0].year, months[0].month);
  const defaultEndDate =
    params.endDate ??
    toIsoDate(months[months.length - 1].year, months[months.length - 1].month);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Contas fixas</h1>

          <p className="text-muted-foreground">
            Checklist por período — veja de uma vez se as contas fixas foram
            pagas, inclusive em meses anteriores
          </p>
        </div>

        <RecurringBillForm categories={categories} />
      </div>

      <RecurringBillPeriodFilter
        period={period}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />

      {bills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui nenhuma conta fixa cadastrada.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor esperado</TableHead>

                {months.map((reference) => (
                  <TableHead
                    key={`${reference.year}-${reference.month}`}
                    className="text-center"
                  >
                    {monthLabel(reference.year, reference.month)}
                  </TableHead>
                ))}

                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">
                    {bill.name}
                    {!bill.active && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        inativa
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {bill.category ? (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: bill.category.color ?? "#999",
                          }}
                        />
                        {bill.category.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>Dia {bill.dueDay}</TableCell>

                  <TableCell>
                    {bill.expectedAmount !== null ? (
                      <SensitiveValue>
                        {currency.format(bill.expectedAmount)}
                      </SensitiveValue>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  {bill.history.map((entry) => (
                    <TableCell
                      key={`${entry.year}-${entry.month}`}
                      className="text-center"
                    >
                      <RecurringBillMonthCell
                        recurringBillId={bill.id}
                        billName={bill.name}
                        year={entry.year}
                        month={entry.month}
                        monthLabel={monthLabel(entry.year, entry.month)}
                        paid={entry.paid}
                        linkedTransaction={entry.transaction}
                        transactionOptions={
                          transactionOptionsByMonth[
                            `${entry.year}-${entry.month}`
                          ] ?? []
                        }
                      />
                    </TableCell>
                  ))}

                  <TableCell>
                    <div className="flex gap-2">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
