import { auth } from "@/auth";
import {
  getAccountOptions,
  getCategoryOptions,
  getTransactions,
  resolveTransactionDateRange,
  resolveTransactionPeriod,
} from "@/services/transaction";
import { getCreditCardOptions } from "@/services/credit-card";
import { getRecurringBillOptions } from "@/services/recurring-bill";
import { restoreSavedFilters } from "@/lib/saved-filters-server";
import { TransactionForm } from "./transaction-form";
import { TransactionItem } from "./transaction-item";
import { TransactionFilters } from "./transaction-filters";

export const dynamic = "force-dynamic";

function toIsoDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

type TransactionsPageProps = {
  searchParams: Promise<{
    accountId?: string;
    categoryId?: string;
    creditCardId?: string;
    type?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const params = await searchParams;

  await restoreSavedFilters("transacoes", params);

  const accountId = params.accountId || undefined;
  const categoryId = params.categoryId || undefined;
  const creditCardId = params.creditCardId || undefined;
  const type =
    params.type === "income" || params.type === "expense"
      ? params.type
      : undefined;
  const period = resolveTransactionPeriod(
    params.period,
    params.startDate,
    params.endDate,
  );
  const { startDate, endDate } = resolveTransactionDateRange(
    period,
    params.startDate,
    params.endDate,
  );

  const hasActiveFilters = Boolean(
    accountId || categoryId || creditCardId || type || period,
  );

  const [transactions, accounts, categories, creditCards, recurringBills] =
    await Promise.all([
      getTransactions(userId, {
        accountId,
        categoryId,
        creditCardId,
        type,
        startDate,
        endDate,
      }),
      getAccountOptions(userId),
      getCategoryOptions(userId),
      getCreditCardOptions(userId),
      getRecurringBillOptions(userId),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>

          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>

        <TransactionForm
          accounts={accounts}
          categories={categories}
          creditCards={creditCards}
          recurringBills={recurringBills}
        />
      </div>

      <TransactionFilters
        key={[
          params.accountId,
          params.categoryId,
          params.creditCardId,
          params.type,
          params.period,
          params.startDate,
          params.endDate,
        ].join("|")}
        accounts={accounts}
        categories={categories}
        creditCards={creditCards}
        defaultValues={{
          accountId: params.accountId ?? "",
          categoryId: params.categoryId ?? "",
          creditCardId: params.creditCardId ?? "",
          type: params.type ?? "",
          startDate: period === "custom" ? params.startDate ?? "" : toIsoDate(startDate),
          endDate: period === "custom" ? params.endDate ?? "" : toIsoDate(endDate),
        }}
        period={period}
        hasActiveFilters={hasActiveFilters}
      />

      {transactions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "Nenhuma transação encontrada com os filtros selecionados."
              : "Você ainda não possui nenhuma transação."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              accounts={accounts}
              categories={categories}
              creditCards={creditCards}
              recurringBills={recurringBills}
            />
          ))}
        </div>
      )}
    </div>
  );
}
