"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";

type Period = "3-months" | "6-months" | "12-months" | "24-months" | "custom";

const PRESETS: { value: Period; label: string }[] = [
  { value: "3-months", label: "Últimos 3 meses" },
  { value: "6-months", label: "Últimos 6 meses" },
  { value: "12-months", label: "Últimos 12 meses" },
  { value: "24-months", label: "Últimos 24 meses" },
];

type RecurringBillPeriodFilterProps = {
  period: Period;
  defaultStartDate: string;
  defaultEndDate: string;
};

export function RecurringBillPeriodFilter({
  period,
  defaultStartDate,
  defaultEndDate,
}: RecurringBillPeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  function goToPreset(value: Period) {
    router.push(`${pathname}?period=${value}`);
  }

  function handleCustomSubmit(formData: FormData) {
    const startDate = formData.get("startDate")?.toString();
    const endDate = formData.get("endDate")?.toString();

    const params = new URLSearchParams({ period: "custom" });

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={period === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => goToPreset(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <form
        key={`${period}-${defaultStartDate}-${defaultEndDate}`}
        action={handleCustomSubmit}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">De</label>

          <DateInput
            name="startDate"
            defaultValue={defaultStartDate}
            className="w-40"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Até</label>

          <DateInput
            name="endDate"
            defaultValue={defaultEndDate}
            className="w-40"
          />
        </div>

        <Button
          type="submit"
          variant={period === "custom" ? "default" : "outline"}
          size="sm"
        >
          Período personalizado
        </Button>
      </form>
    </div>
  );
}
