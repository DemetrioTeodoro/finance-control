"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCategory } from "@/actions/category";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CategoryDeleteDialogProps = {
  open: boolean;
  category: {
    id: string;
    name: string;
  };
  hasTransactions: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryDeleteDialog({
  open,
  category,
  hasTransactions,
  onOpenChange,
}: CategoryDeleteDialogProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      const formData = new FormData();

      formData.set("categoryId", category.id);

      const result = await deleteCategory(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Categoria excluída com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);

      toast.error("Não foi possível excluir a categoria.");
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
          <DialogTitle>Excluir categoria</DialogTitle>

          <DialogDescription>
            {hasTransactions ? (
              <>
                A categoria <strong>{category.name}</strong> possui
                transações vinculadas. Elas continuarão existindo, mas
                ficarão sem categoria. Deseja continuar?
              </>
            ) : (
              <>
                Tem certeza que deseja excluir a categoria{" "}
                <strong>{category.name}</strong>? Essa ação não pode ser
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

          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
