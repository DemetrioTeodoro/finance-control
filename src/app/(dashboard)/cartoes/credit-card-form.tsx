"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createCreditCard } from "@/actions/credit-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreditCardForm() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await createCreditCard(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Novo cartão</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Novo cartão</h2>

        <form action={handleSubmit} className="space-y-4">
          <Input name="name" placeholder="Nome do cartão" required />

          <Input
            name="limit"
            type="number"
            step="0.01"
            min="0"
            placeholder="Limite (opcional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="closingDay"
              type="number"
              min="1"
              max="31"
              placeholder="Dia de fechamento"
              required
            />

            <Input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              placeholder="Dia de vencimento"
              required
            />
          </div>

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

            <Button type="submit">Criar cartão</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
