"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountEditForm } from "./account-edit-form";

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

      {editing && (
        <AccountEditForm account={account} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
