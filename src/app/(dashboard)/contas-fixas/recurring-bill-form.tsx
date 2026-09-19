"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createRecurringBill } from "@/actions/recurring-bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Category = {
  id: string;
  name: string;
};

type RecurringBillFormProps = {
  categories: Category[];
};

export function RecurringBillForm({ categories }: RecurringBillFormProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const result = await createRecurringBill(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Conta fixa criada com sucesso.");

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao criar conta fixa:", error);

      toast.error("Não foi possível criar a conta fixa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nova conta fixa</Button>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) {
            setOpen(value);
          }
        }}
      >
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta fixa</DialogTitle>

          <DialogDescription>
            Cadastre uma conta que se repete todo mês, como aluguel, internet
            ou energia.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <Input
            name="name"
            placeholder="Nome (ex.: Aluguel)"
            required
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="expectedAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Valor esperado (opcional)"
              disabled={saving}
            />

            <Input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              placeholder="Dia de vencimento"
              required
              disabled={saving}
            />
          </div>

          <select
            name="categoryId"
            disabled={saving}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Sem categoria</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <p className="text-xs text-muted-foreground">
            Se a categoria escolhida for usada em uma transação de despesa no
            mês, a conta é marcada como paga automaticamente.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar conta fixa"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
