"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountDeleteDialog } from "./account-delete-dialog";

type AccountDeleteButtonProps = {
  account: {
    id: string;
    name: string;
  };
  hasTransactions: boolean;
};

export function AccountDeleteButton({
  account,
  hasTransactions,
}: AccountDeleteButtonProps) {
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

      <AccountDeleteDialog
        open={deleting}
        account={account}
        hasTransactions={hasTransactions}
        onOpenChange={setDeleting}
      />
    </>
  );
}
