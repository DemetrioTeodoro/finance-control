"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CategoryDeleteDialog } from "./category-delete-dialog";

type CategoryDeleteButtonProps = {
  category: {
    id: string;
    name: string;
  };
  hasTransactions: boolean;
};

export function CategoryDeleteButton({
  category,
  hasTransactions,
}: CategoryDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Excluir
      </Button>

      <CategoryDeleteDialog
        open={open}
        category={category}
        hasTransactions={hasTransactions}
        onOpenChange={setOpen}
      />
    </>
  );
}
