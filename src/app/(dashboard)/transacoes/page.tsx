import { auth } from "@/auth";
import {
  getAccountOptions,
  getCategoryOptions,
  getTransactions,
} from "@/services/transaction";
import { TransactionForm } from "./transaction-form";
import { TransactionItem } from "./transaction-item";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(userId),
    getAccountOptions(userId),
    getCategoryOptions(userId),
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

        <TransactionForm accounts={accounts} categories={categories} />
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Você ainda não possui nenhuma transação.
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
