"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createTransaction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";

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

type TransactionFormProps = {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
};

export function TransactionForm({
  accounts,
  categories,
  creditCards,
}: TransactionFormProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await createTransaction(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Transação criada com sucesso!");

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nova transação</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Nova transação</h2>

        <form action={handleSubmit} className="space-y-4">
          <Input name="description" placeholder="Descrição" required />

          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Valor"
            required
          />

          <select
            name="type"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tipo de transação</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>

          <DateInput name="date" required />

          <select
            name="accountId"
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Sem categoria</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="creditCardId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Sem cartão</option>

            {creditCards.map((creditCard) => (
              <option key={creditCard.id} value={creditCard.id}>
                {creditCard.name}
              </option>
            ))}
          </select>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button type="submit">Criar transação</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
