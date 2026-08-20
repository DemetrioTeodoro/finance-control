"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountForm() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await createAccount(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Conta criada com sucesso!");

    router.refresh();
    setOpen(false);
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nova conta</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Nova conta</h2>

        <form action={handleSubmit} className="space-y-4">
          <Input name="name" placeholder="Nome da conta" required />

          <Input name="type" placeholder="Tipo (ex: Conta corrente)" required />

          <Input
            name="balance"
            type="number"
            step="0.01"
            placeholder="Saldo inicial"
            required
          />

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button type="submit">Criar conta</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
