"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCreditCard } from "@/actions/credit-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CreditCardDeleteDialogProps = {
  open: boolean;
  creditCard: {
    id: string;
    name: string;
  };
  hasTransactions: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreditCardDeleteDialog({
  open,
  creditCard,
  hasTransactions,
  onOpenChange,
}: CreditCardDeleteDialogProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      const formData = new FormData();

      formData.set("creditCardId", creditCard.id);

      const result = await deleteCreditCard(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Cartão excluído com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);

      toast.error("Não foi possível excluir o cartão.");
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
          <DialogTitle>Excluir cartão</DialogTitle>

          <DialogDescription>
            {hasTransactions ? (
              <>
                O cartão <strong>{creditCard.name}</strong> possui transações
                vinculadas. Elas continuarão existindo, mas ficarão sem
                cartão. Deseja continuar?
              </>
            ) : (
              <>
                Tem certeza que deseja excluir o cartão{" "}
                <strong>{creditCard.name}</strong>? Essa ação não pode ser
                desfeita.
              </>
            )}
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
