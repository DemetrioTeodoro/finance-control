"use client";

import { SensitiveValue } from "@/components/sensitive-value";

type CategoryExpenseChartProps = {
  data: {
    name: string;
    color: string | null;
    amount: number;
  }[];
  emptyMessage?: string;
};

const MAX_ROWS = 6;
const FALLBACK_COLOR = "#94a3b8";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function CategoryExpenseChart({
  data,
  emptyMessage = "Nenhuma despesa registrada este mês.",
}: CategoryExpenseChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const top = data.slice(0, MAX_ROWS);
  const rest = data.slice(MAX_ROWS);

  const rows =
    rest.length > 0
      ? [
          ...top,
          {
            name: "Outras",
            color: FALLBACK_COLOR,
            amount: rest.reduce((total, item) => total + item.amount, 0),
          },
        ]
      : top;

  const maxAmount = Math.max(...rows.map((row) => row.amount), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.name}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color ?? FALLBACK_COLOR }}
              />

              <span className="truncate">{row.name}</span>
            </span>

            <SensitiveValue className="shrink-0 whitespace-nowrap text-muted-foreground">
              {currency.format(row.amount)}
            </SensitiveValue>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.amount / maxAmount) * 100}%`,
                backgroundColor: row.color ?? FALLBACK_COLOR,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
