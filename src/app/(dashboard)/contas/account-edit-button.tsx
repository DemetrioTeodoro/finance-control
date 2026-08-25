"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountEditDialog } from "./account-edit-dialog";

type AccountEditButtonProps = {
  account: {
    id: string;
    name: string;
    type: string;
  };
};

export function AccountEditButton({ account }: AccountEditButtonProps) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Editar
      </Button>

      <AccountEditDialog
        open={editing}
        account={account}
        onOpenChange={setEditing}
      />
    </>
  );
}
