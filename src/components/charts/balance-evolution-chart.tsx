"use client";

import { useId, useRef, useState } from "react";

import { SensitiveValue } from "@/components/sensitive-value";

type BalanceEvolutionChartProps = {
  data: {
    label: string;
    balance: number;
  }[];
};

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = { top: 16, right: 12, bottom: 28, left: 64 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function BalanceEvolutionChart({ data }: BalanceEvolutionChartProps) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Sem dados suficientes para exibir a evolução do saldo.
      </p>
    );
  }

  const values = data.map((point) => point.balance);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const span = rawMax - rawMin || 1;
  const min = rawMin - span * 0.1;
  const max = rawMax + span * 0.1;

  function xFor(index: number) {
    if (data.length === 1) {
      return PADDING.left + PLOT_WIDTH / 2;
    }

    return PADDING.left + (index / (data.length - 1)) * PLOT_WIDTH;
  }

  function yFor(value: number) {
    return PADDING.top + (1 - (value - min) / (max - min)) * PLOT_HEIGHT;
  }

  const linePath = data
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.balance)}`)
    .join(" ");

  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${PADDING.top + PLOT_HEIGHT} L ${xFor(0)} ${PADDING.top + PLOT_HEIGHT} Z`;

  const zeroY = min < 0 && max > 0 ? yFor(0) : null;

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const fraction = (relativeX - PADDING.left) / PLOT_WIDTH;
    const index = Math.round(fraction * (data.length - 1));

    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label="Evolução do saldo nos últimos meses"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {zeroY !== null && (
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={zeroY}
            y2={zeroY}
            className="stroke-muted-foreground/30"
            strokeWidth={1}
          />
        )}

        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + PLOT_HEIGHT}
          y2={PADDING.top + PLOT_HEIGHT}
          className="stroke-muted-foreground/30"
          strokeWidth={1}
        />

        <path d={areaPath} fill={`url(#${gradientId})`} className="text-primary" />

        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-primary"
        />

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING.top}
            y2={PADDING.top + PLOT_HEIGHT}
            className="stroke-muted-foreground/40"
            strokeWidth={1}
          />
        )}

        {data.map((point, index) => (
          <circle
            key={point.label}
            cx={xFor(index)}
            cy={yFor(point.balance)}
            r={hoverIndex === index ? 5 : 3}
            className="fill-primary stroke-card"
            strokeWidth={2}
          />
        ))}

        {data.map((point, index) => {
          if (data.length > 8 && index % Math.ceil(data.length / 6) !== 0) {
            return null;
          }

          return (
            <text
              key={point.label}
              x={xFor(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      {hovered && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
            transform:
              hoverIndex < data.length / 2
                ? "translateX(8px)"
                : "translateX(calc(-100% - 8px))",
          }}
        >
          <p className="font-medium text-popover-foreground">
            <SensitiveValue>{currency.format(hovered.balance)}</SensitiveValue>
          </p>
          <p className="text-muted-foreground">{hovered.label}</p>
        </div>
      )}
    </div>
  );
}
