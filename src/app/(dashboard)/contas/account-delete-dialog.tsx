"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteAccount } from "@/actions/account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AccountDeleteDialogProps = {
  open: boolean;
  account: {
    id: string;
    name: string;
  };
  hasTransactions: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountDeleteDialog({
  open,
  account,
  hasTransactions,
  onOpenChange,
}: AccountDeleteDialogProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function handleDelete(mode?: "unlink" | "delete-transactions") {
    setDeleting(true);

    try {
      const formData = new FormData();

      formData.set("accountId", account.id);

      if (mode) {
        formData.set("mode", mode);
      }

      const result = await deleteAccount(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Conta excluída com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir conta:", error);

      toast.error("Não foi possível excluir a conta.");
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
          <DialogTitle>Excluir conta</DialogTitle>

          <DialogDescription>
            {hasTransactions ? (
              <>
                A conta <strong>{account.name}</strong> possui transações
                vinculadas. O que deseja fazer?
              </>
            ) : (
              <>
                Tem certeza que deseja excluir a conta{" "}
                <strong>{account.name}</strong>? Essa ação não pode ser
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

          {hasTransactions ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleDelete("unlink")}
                disabled={deleting}
              >
                Deixar transações sem conta
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleDelete("delete-transactions")}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Excluir transações e a conta"}
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={() => handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
