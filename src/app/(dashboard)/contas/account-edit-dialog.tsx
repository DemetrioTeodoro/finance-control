"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateAccount } from "@/actions/account";
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

type AccountEditDialogProps = {
  open: boolean;
  account: {
    id: string;
    name: string;
    type: string;
  };
  onOpenChange: (open: boolean) => void;
};

export function AccountEditDialog({
  open,
  account,
  onOpenChange,
}: AccountEditDialogProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const result = await updateAccount(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Conta atualizada com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar conta:", error);

      toast.error("Não foi possível atualizar a conta.");
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
          <DialogTitle>Editar conta</DialogTitle>

          <DialogDescription>
            Altere as informações da conta abaixo.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="accountId" value={account.id} />

          <Input
            name="name"
            placeholder="Nome da conta"
            defaultValue={account.name}
            required
            disabled={saving}
          />

          <Input
            name="type"
            placeholder="Tipo (ex: Conta corrente)"
            defaultValue={account.type}
            required
            disabled={saving}
          />

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
