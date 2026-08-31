"use client";

import { useState } from "react";

import { SensitiveValue } from "@/components/sensitive-value";

type IncomeExpenseChartProps = {
  data: {
    label: string;
    income: number;
    expense: number;
  }[];
};

type HoverInfo = {
  x: number;
  y: number;
  label: string;
  value: number;
  series: "income" | "expense";
};

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 8, right: 12, bottom: 28, left: 56 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const MAX_BAR_WIDTH = 20;
const BAR_GAP = 3;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Sem dados suficientes para exibir receitas e despesas.
      </p>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((point) => [point.income, point.expense]),
    1,
  );

  const groupWidth = PLOT_WIDTH / data.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, (groupWidth - BAR_GAP * 3) / 2);

  function heightFor(value: number) {
    return (value / maxValue) * PLOT_HEIGHT;
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-green-500" />
          Receitas
        </span>

        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-red-500" />
          Despesas
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Receitas e despesas por mês"
      >
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + PLOT_HEIGHT}
          y2={PADDING.top + PLOT_HEIGHT}
          className="stroke-muted-foreground/30"
          strokeWidth={1}
        />

        {data.map((point, index) => {
          const groupX = PADDING.left + index * groupWidth;
          const centerGap = 2;

          const incomeHeight = heightFor(point.income);
          const expenseHeight = heightFor(point.expense);

          const incomeX = groupX + groupWidth / 2 - barWidth - centerGap / 2;
          const expenseX = groupX + groupWidth / 2 + centerGap / 2;

          return (
            <g key={point.label}>
              <rect
                x={incomeX}
                y={PADDING.top + PLOT_HEIGHT - incomeHeight}
                width={barWidth}
                height={Math.max(incomeHeight, 1)}
                rx={3}
                className="fill-green-500 transition-opacity hover:opacity-80"
                onPointerEnter={() =>
                  setHover({
                    x: incomeX + barWidth / 2,
                    y: PADDING.top + PLOT_HEIGHT - incomeHeight,
                    label: point.label,
                    value: point.income,
                    series: "income",
                  })
                }
                onPointerLeave={() => setHover(null)}
              />

              <rect
                x={expenseX}
                y={PADDING.top + PLOT_HEIGHT - expenseHeight}
                width={barWidth}
                height={Math.max(expenseHeight, 1)}
                rx={3}
                className="fill-red-500 transition-opacity hover:opacity-80"
                onPointerEnter={() =>
                  setHover({
                    x: expenseX + barWidth / 2,
                    y: PADDING.top + PLOT_HEIGHT - expenseHeight,
                    label: point.label,
                    value: point.expense,
                    series: "expense",
                  })
                }
                onPointerLeave={() => setHover(null)}
              />

              <text
                x={groupX + groupWidth / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(hover.x / WIDTH) * 100}%`,
            top: `${(hover.y / HEIGHT) * 100}%`,
            transform: "translate(-50%, -100%) translateY(-6px)",
          }}
        >
          <p className="font-medium text-popover-foreground">
            <SensitiveValue>{currency.format(hover.value)}</SensitiveValue>
          </p>
          <p className="text-muted-foreground">
            {hover.series === "income" ? "Receitas" : "Despesas"} · {hover.label}
          </p>
        </div>
      )}
    </div>
  );
}
