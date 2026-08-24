"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTransaction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
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

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  accountId: string | null;
  categoryId: string | null;
  account: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

type TransactionItemProps = {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
};

export function TransactionItem({
  transaction,
  accounts,
  categories,
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
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <p className="font-medium">{transaction.description}</p>

          <p className="text-sm text-muted-foreground">
            {transaction.account?.name ?? "Sem conta"} ·{" "}
            {new Intl.DateTimeFormat("pt-BR").format(transaction.date)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <p
            className={`font-semibold ${
              transaction.type === "income" ? "text-green-500" : "text-red-500"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}
            {currency.format(transaction.amount)}
          </p>

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

      {editing && (
        <TransactionEditForm
          transaction={transaction}
          accounts={accounts}
          categories={categories}
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
