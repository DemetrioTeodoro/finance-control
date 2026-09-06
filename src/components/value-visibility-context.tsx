"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { updateValueVisibility } from "@/actions/user-preferences";

type ValueVisibilityContextValue = {
  visible: boolean;
  toggle: () => void;
};

const ValueVisibilityContext =
  createContext<ValueVisibilityContextValue | null>(null);

export function ValueVisibilityProvider({
  children,
  initialVisible,
}: {
  children: ReactNode;
  initialVisible: boolean;
}) {
  const [visible, setVisible] = useState(initialVisible);

  function toggle() {
    const next = !visible;

    setVisible(next);

    updateValueVisibility(next).then((result) => {
      if (result?.error) {
        setVisible(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <ValueVisibilityContext.Provider value={{ visible, toggle }}>
      {children}
    </ValueVisibilityContext.Provider>
  );
}

export function useValueVisibility() {
  const context = useContext(ValueVisibilityContext);

  if (!context) {
    throw new Error(
      "useValueVisibility deve ser usado dentro de ValueVisibilityProvider",
    );
  }

  return context;
}
