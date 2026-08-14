"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./ui/button";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={() => setTheme("light")}>
        <Sun />
      </Button>

      <Button variant="outline" size="icon" onClick={() => setTheme("dark")}>
        <Moon />
      </Button>
    </div>
  );
}
