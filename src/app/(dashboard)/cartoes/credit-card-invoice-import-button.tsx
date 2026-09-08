"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreditCardInvoiceImportDialog } from "./credit-card-invoice-import-dialog";

type CreditCardOption = {
  id: string;
  name: string;
};

type CreditCardInvoiceImportButtonProps = {
  creditCardOptions: CreditCardOption[];
  defaultCreditCardId?: string;
};

export function CreditCardInvoiceImportButton({
  creditCardOptions,
  defaultCreditCardId,
}: CreditCardInvoiceImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={creditCardOptions.length === 0}
        onClick={() => setOpen(true)}
      >
        Importar fatura
      </Button>

      <CreditCardInvoiceImportDialog
        open={open}
        creditCardOptions={creditCardOptions}
        defaultCreditCardId={defaultCreditCardId}
        onOpenChange={setOpen}
      />
    </>
  );
}
