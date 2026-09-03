"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTransaction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { SensitiveValue } from "@/components/sensitive-value";
import { TransactionEditForm } from "./transaction-edit-form";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type CreditCard = {
  id: string;
  name: string;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  accountId: string | null;
  categoryId: string | null;
  creditCardId: string | null;
  account: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  creditCard: {
    id: string;
    name: string;
  } | null;
};

type TransactionItemProps = {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
};

export function TransactionItem({
  transaction,
  accounts,
  categories,
  creditCards,
}: TransactionItemProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  async function handleDelete() {
    setDeleting(true);

    try {
      const formData = new FormData();

      formData.set("transactionId", transaction.id);

      const result = await deleteTransaction(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setDeleteDialogOpen(false);

      toast.success("Transação excluída com sucesso.");

      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);

      toast.error("Não foi possível excluir a transação.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{transaction.description}</p>

          <p className="truncate text-sm text-muted-foreground">
            {transaction.creditCard?.name ??
              transaction.account?.name ??
              "Sem conta"}{" "}
            ·{" "}
            {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
              transaction.date,
            )}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
          <SensitiveValue
            className={`shrink-0 font-semibold whitespace-nowrap ${
              transaction.type === "income" ? "text-green-500" : "text-red-500"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {currency.format(transaction.amount)}
          </SensitiveValue>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={deleting}
            >
              Editar
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {editing && (
        <TransactionEditForm
          transaction={transaction}
          accounts={accounts}
          categories={categories}
          creditCards={creditCards}
          onClose={() => setEditing(false)}
        />
      )}

      <DeleteTransactionDialog
        open={deleteDialogOpen}
        transactionDescription={transaction.description}
        deleting={deleting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </>
  );
}
