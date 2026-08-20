"use client";

import { useState } from "react";

import { createCategory } from "@/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryForm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const result = await createCategory(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Categoria criada com sucesso!");

    window.location.reload();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nova categoria</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Nova categoria</h2>

        <form action={handleSubmit} className="space-y-4">
          <Input name="name" placeholder="Nome da categoria" required />

          <div>
            <label className="mb-2 block text-sm font-medium">Cor</label>

            <Input
              name="color"
              type="color"
              defaultValue="#64748b"
              className="h-10 cursor-pointer p-1"
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

            <Button type="submit">Criar categoria</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
