"use client";

import type { ReactNode } from "react";

import { useValueVisibility } from "@/components/value-visibility-context";

type SensitiveValueProps = {
  children: ReactNode;
  className?: string;
};

export function SensitiveValue({ children, className }: SensitiveValueProps) {
  const { visible } = useValueVisibility();

  if (!visible) {
    return (
      <span className={className} aria-hidden="true">
        ••••••
      </span>
    );
  }

  return <span className={className}>{children}</span>;
}
