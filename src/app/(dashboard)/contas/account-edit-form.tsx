"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateAccount } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountEditFormProps = {
  account: {
    id: string;
    name: string;
    type: string;
  };
  onClose: () => void;
};

export function AccountEditForm({ account, onClose }: AccountEditFormProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await updateAccount(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Editar conta</h2>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="accountId" value={account.id} />

          <Input
            name="name"
            placeholder="Nome da conta"
            defaultValue={account.name}
            required
          />

          <Input
            name="type"
            placeholder="Tipo (ex: Conta corrente)"
            defaultValue={account.type}
            required
          />

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
