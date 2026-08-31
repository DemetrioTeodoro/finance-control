"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCreditCard } from "@/actions/credit-card";
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

type CreditCardEditDialogProps = {
  open: boolean;
  creditCard: {
    id: string;
    name: string;
    limit: number | null;
    closingDay: number;
    dueDay: number;
  };
  onOpenChange: (open: boolean) => void;
};

export function CreditCardEditDialog({
  open,
  creditCard,
  onOpenChange,
}: CreditCardEditDialogProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const result = await updateCreditCard(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Cartão atualizado com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar cartão:", error);

      toast.error("Não foi possível atualizar o cartão.");
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
          <DialogTitle>Editar cartão</DialogTitle>

          <DialogDescription>
            Altere as informações do cartão abaixo.
          </DialogDescription>
        </DialogHeader>

        <form
          key={`${creditCard.name}-${creditCard.limit}-${creditCard.closingDay}-${creditCard.dueDay}`}
          action={handleSubmit}
          className="space-y-4"
        >
          <input type="hidden" name="creditCardId" value={creditCard.id} />

          <Input
            name="name"
            placeholder="Nome do cartão"
            defaultValue={creditCard.name}
            required
            disabled={saving}
          />

          <Input
            name="limit"
            type="number"
            step="0.01"
            min="0"
            placeholder="Limite (opcional)"
            defaultValue={creditCard.limit ?? ""}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="closingDay"
              type="number"
              min="1"
              max="31"
              placeholder="Dia de fechamento"
              defaultValue={creditCard.closingDay}
              required
              disabled={saving}
            />

            <Input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              placeholder="Dia de vencimento"
              defaultValue={creditCard.dueDay}
              required
              disabled={saving}
            />
          </div>

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
