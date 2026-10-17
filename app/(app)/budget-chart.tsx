"use client";

import { formatBRL } from "@/lib/format";

export type BudgetChartRow = {
  name: string;
  budgeted: number;
  spent: number;
};

export function BudgetChart({ rows }: { rows: BudgetChartRow[] }) {
  if (rows.length === 0) return null;

  const max = Math.max(...rows.flatMap((row) => [row.budgeted, row.spent]), 1);
  const barMax = 160;
  const groupW = 56;
  const gap = 24;
  const labelH = 36;
  const padL = 8;
  const padT = 8;
  const width = Math.max(280, padL * 2 + rows.length * (groupW + gap) - gap);
  const height = padT + barMax + labelH;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-full h-56"
        role="img"
        aria-label="Gráfico de orçamento previsto versus gasto por categoria"
      >
        {rows.map((row, index) => {
          const x = padL + index * (groupW + gap);
          const budgetH = Math.max(2, (row.budgeted / max) * barMax);
          const spentH = Math.max(row.spent > 0 ? 2 : 0, (row.spent / max) * barMax);
          const over = row.spent > row.budgeted && row.budgeted > 0;
          return (
            <g key={row.name}>
              <title>
                {row.name}: previsto {formatBRL(row.budgeted)}, gasto {formatBRL(row.spent)}
              </title>
              <rect
                x={x}
                y={padT + barMax - budgetH}
                width={22}
                height={budgetH}
                rx={8}
                className="fill-concrete"
              />
              <rect
                x={x + 26}
                y={padT + barMax - spentH}
                width={22}
                height={spentH}
                rx={8}
                className={over ? "fill-delay" : "fill-primary"}
              />
              <text
                x={x + groupW / 2}
                y={padT + barMax + 14}
                textAnchor="middle"
                className="fill-foreground text-[10px]"
              >
                {row.name.length > 12 ? `${row.name.slice(0, 11)}…` : row.name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 text-xs text-muted-foreground mt-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-concrete border border-graphite" /> Previsto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary border border-graphite" /> Gasto
        </span>
      </div>
    </div>
  );
}
