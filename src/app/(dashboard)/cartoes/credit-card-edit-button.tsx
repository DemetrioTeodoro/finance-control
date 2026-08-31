"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreditCardEditDialog } from "./credit-card-edit-dialog";

type CreditCardEditButtonProps = {
  creditCard: {
    id: string;
    name: string;
    limit: number | null;
    closingDay: number;
    dueDay: number;
  };
};

export function CreditCardEditButton({ creditCard }: CreditCardEditButtonProps) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Editar
      </Button>

      <CreditCardEditDialog
        open={editing}
        creditCard={creditCard}
        onOpenChange={setEditing}
      />
    </>
  );
}
