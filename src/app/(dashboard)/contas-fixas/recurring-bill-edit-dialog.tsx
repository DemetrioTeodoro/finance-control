"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateRecurringBill } from "@/actions/recurring-bill";
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

type RecurringBillEditDialogProps = {
  open: boolean;
  recurringBill: {
    id: string;
    name: string;
    expectedAmount: number | null;
    dueDay: number;
    active: boolean;
    categoryId: string | null;
  };
  categories: Category[];
  onOpenChange: (open: boolean) => void;
};

export function RecurringBillEditDialog({
  open,
  recurringBill,
  categories,
  onOpenChange,
}: RecurringBillEditDialogProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const result = await updateRecurringBill(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Conta fixa atualizada com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar conta fixa:", error);

      toast.error("Não foi possível atualizar a conta fixa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta fixa</DialogTitle>

          <DialogDescription>
            Altere as informações da conta fixa abaixo.
          </DialogDescription>
        </DialogHeader>

        <form
          key={`${recurringBill.name}-${recurringBill.expectedAmount}-${recurringBill.dueDay}-${recurringBill.active}-${recurringBill.categoryId}`}
          action={handleSubmit}
          className="space-y-4"
        >
          <input
            type="hidden"
            name="recurringBillId"
            value={recurringBill.id}
          />

          <Input
            name="name"
            placeholder="Nome (ex.: Aluguel)"
            defaultValue={recurringBill.name}
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
              defaultValue={recurringBill.expectedAmount ?? ""}
              disabled={saving}
            />

            <Input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              placeholder="Dia de vencimento"
              defaultValue={recurringBill.dueDay}
              required
              disabled={saving}
            />
          </div>

          <select
            name="categoryId"
            defaultValue={recurringBill.categoryId ?? ""}
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

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="active"
              defaultChecked={recurringBill.active}
              disabled={saving}
            />
            Conta fixa ativa (gera lembrete e aparece no checklist)
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
