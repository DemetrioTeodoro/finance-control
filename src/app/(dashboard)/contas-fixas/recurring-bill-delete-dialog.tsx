"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteRecurringBill } from "@/actions/recurring-bill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RecurringBillDeleteDialogProps = {
  open: boolean;
  recurringBill: {
    id: string;
    name: string;
  };
  onOpenChange: (open: boolean) => void;
};

export function RecurringBillDeleteDialog({
  open,
  recurringBill,
  onOpenChange,
}: RecurringBillDeleteDialogProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      const formData = new FormData();

      formData.set("recurringBillId", recurringBill.id);

      const result = await deleteRecurringBill(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Conta fixa excluída com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir conta fixa:", error);

      toast.error("Não foi possível excluir a conta fixa.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!deleting) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta fixa</DialogTitle>

          <DialogDescription>
            Tem certeza que deseja excluir a conta fixa{" "}
            <strong>{recurringBill.name}</strong>? O histórico de meses
            confirmados também será removido. Essa ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
