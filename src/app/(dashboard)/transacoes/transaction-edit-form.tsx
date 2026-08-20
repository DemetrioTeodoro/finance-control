"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateTransaction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
};

type TransactionEditFormProps = {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
};

export function TransactionEditForm({
  transaction,
  accounts,
  categories,
  onClose,
}: TransactionEditFormProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");

  const dateValue = new Date(transaction.date).toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    setMessage("");

    formData.set("transactionId", transaction.id);

    const result = await updateTransaction(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Editar transação</h2>

        <form action={handleSubmit} className="space-y-4">
          <Input
            name="description"
            placeholder="Descrição"
            defaultValue={transaction.description}
            required
          />

          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Valor"
            defaultValue={transaction.amount}
            required
          />

          <select
            name="type"
            defaultValue={transaction.type}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>

          <Input name="date" type="date" defaultValue={dateValue} required />

          <select
            name="accountId"
            defaultValue={transaction.accountId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Sem conta</option>

            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            name="categoryId"
            defaultValue={transaction.categoryId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Sem categoria</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {message && <p className="text-sm text-destructive">{message}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
