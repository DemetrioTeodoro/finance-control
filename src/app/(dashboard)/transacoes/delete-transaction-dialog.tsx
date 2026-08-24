"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DeleteTransactionDialogProps = {
  open: boolean;
  transactionDescription: string;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteTransactionDialog({
  open,
  transactionDescription,
  deleting,
  onOpenChange,
  onConfirm,
}: DeleteTransactionDialogProps) {
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
          <DialogTitle>Excluir transação?</DialogTitle>

          <DialogDescription>
            Tem certeza que deseja excluir a transação{" "}
            <strong>{transactionDescription}</strong>?
            <br />
            Essa ação não pode ser desfeita.
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

          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
