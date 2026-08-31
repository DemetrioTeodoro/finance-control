"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CategoryEditDialog } from "./category-edit-dialog";

type CategoryEditButtonProps = {
  category: {
    id: string;
    name: string;
    color: string | null;
  };
};

export function CategoryEditButton({ category }: CategoryEditButtonProps) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Editar
      </Button>

      <CategoryEditDialog
        open={editing}
        category={category}
        onOpenChange={setEditing}
      />
    </>
  );
}
