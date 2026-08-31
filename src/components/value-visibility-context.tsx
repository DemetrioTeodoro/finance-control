"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const COOKIE_NAME = "values-visible";

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
    setVisible((prev) => {
      const next = !prev;

      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;

      return next;
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
