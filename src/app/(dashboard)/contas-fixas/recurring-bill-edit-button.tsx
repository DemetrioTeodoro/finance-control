"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RecurringBillEditDialog } from "./recurring-bill-edit-dialog";

type Category = {
  id: string;
  name: string;
};

type RecurringBillEditButtonProps = {
  recurringBill: {
    id: string;
    name: string;
    expectedAmount: number | null;
    dueDay: number;
    active: boolean;
    categoryId: string | null;
  };
  categories: Category[];
};

export function RecurringBillEditButton({
  recurringBill,
  categories,
}: RecurringBillEditButtonProps) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Editar
      </Button>

      <RecurringBillEditDialog
        open={editing}
        recurringBill={recurringBill}
        categories={categories}
        onOpenChange={setEditing}
      />
    </>
  );
}
