"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCategory } from "@/actions/category";
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

type CategoryEditDialogProps = {
  open: boolean;
  category: {
    id: string;
    name: string;
    color: string | null;
  };
  onOpenChange: (open: boolean) => void;
};

export function CategoryEditDialog({
  open,
  category,
  onOpenChange,
}: CategoryEditDialogProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    try {
      const result = await updateCategory(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Categoria atualizada com sucesso.");

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);

      toast.error("Não foi possível atualizar a categoria.");
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
          <DialogTitle>Editar categoria</DialogTitle>

          <DialogDescription>
            Altere as informações da categoria abaixo.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="categoryId" value={category.id} />

          <Input
            name="name"
            placeholder="Nome da categoria"
            defaultValue={category.name}
            required
            disabled={saving}
          />

          <div>
            <label className="mb-2 block text-sm font-medium">Cor</label>

            <Input
              name="color"
              type="color"
              defaultValue={category.color ?? "#64748b"}
              className="h-10 cursor-pointer p-1"
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
