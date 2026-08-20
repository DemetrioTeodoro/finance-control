"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TransactionEditForm } from "./transaction-edit-form";

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
  const [editing, setEditing] = useState(false);

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

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

          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
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
    </>
  );
}
