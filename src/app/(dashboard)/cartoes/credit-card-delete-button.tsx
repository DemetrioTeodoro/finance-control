"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreditCardDeleteDialog } from "./credit-card-delete-dialog";

type CreditCardDeleteButtonProps = {
  creditCard: {
    id: string;
    name: string;
  };
  hasTransactions: boolean;
};

export function CreditCardDeleteButton({
  creditCard,
  hasTransactions,
}: CreditCardDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDeleting(true)}
      >
        Excluir
      </Button>

      <CreditCardDeleteDialog
        open={deleting}
        creditCard={creditCard}
        hasTransactions={hasTransactions}
        onOpenChange={setDeleting}
      />
    </>
  );
}
