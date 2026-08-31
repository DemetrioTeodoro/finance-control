"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-context";

export function SidebarToggleButton() {
  const { toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Abrir menu"
      className="md:hidden"
      onClick={toggle}
    >
      <Menu />
    </Button>
  );
}
