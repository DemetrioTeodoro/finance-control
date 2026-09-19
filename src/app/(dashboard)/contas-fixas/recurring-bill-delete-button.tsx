"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RecurringBillDeleteDialog } from "./recurring-bill-delete-dialog";

type RecurringBillDeleteButtonProps = {
  recurringBill: {
    id: string;
    name: string;
  };
};

export function RecurringBillDeleteButton({
  recurringBill,
}: RecurringBillDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
        Excluir
      </Button>

      <RecurringBillDeleteDialog
        open={deleting}
        recurringBill={recurringBill}
        onOpenChange={setDeleting}
      />
    </>
  );
}
