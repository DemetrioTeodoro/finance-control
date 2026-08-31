"use client";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useValueVisibility } from "@/components/value-visibility-context";

export function ValueVisibilityToggle() {
  const { visible, toggle } = useValueVisibility();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={visible ? "Ocultar valores" : "Mostrar valores"}
      onClick={toggle}
    >
      {visible ? <Eye /> : <EyeOff />}
    </Button>
  );
}
