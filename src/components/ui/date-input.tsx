"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateInputProps = {
  name: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

function displayToIso(display: string) {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;

  return `${year}-${month}-${day}`;
}

function isoToDisplay(iso?: string) {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

export function DateInput({
  name,
  defaultValue,
  required,
  disabled,
  className,
}: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(defaultValue));

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={display}
        onChange={(event) => setDisplay(maskDate(event.target.value))}
        required={required}
        disabled={disabled}
        className="pr-9"
      />

      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground peer-disabled:opacity-50">
        <CalendarIcon className="size-4" />
      </div>

      <input
        type="date"
        tabIndex={-1}
        aria-label="Abrir calendário"
        disabled={disabled}
        value={displayToIso(display)}
        onChange={(event) => setDisplay(isoToDisplay(event.target.value))}
        onClick={(event) => event.currentTarget.showPicker()}
        className="peer absolute inset-y-0 right-0 w-9 cursor-pointer opacity-0 disabled:pointer-events-none"
      />

      <input type="hidden" name={name} value={displayToIso(display)} />
    </div>
  );
}
