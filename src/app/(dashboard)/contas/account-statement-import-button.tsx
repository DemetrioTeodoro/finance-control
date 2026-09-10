"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountStatementImportDialog } from "./account-statement-import-dialog";

type AccountOption = {
  id: string;
  name: string;
};

type AccountStatementImportButtonProps = {
  accountOptions: AccountOption[];
  defaultAccountId?: string;
};

export function AccountStatementImportButton({
  accountOptions,
  defaultAccountId,
}: AccountStatementImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={accountOptions.length === 0}
        onClick={() => setOpen(true)}
      >
        Importar extrato
      </Button>

      <AccountStatementImportDialog
        open={open}
        accountOptions={accountOptions}
        defaultAccountId={defaultAccountId}
        onOpenChange={setOpen}
      />
    </>
  );
}
