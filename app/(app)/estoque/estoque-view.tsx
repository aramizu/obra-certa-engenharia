"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Input, Select, TASK_CHIP_CLASS, chipContrastStyle } from "@/components/ds";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { formatDatePtBR } from "@/lib/date";
import {
  SEM_OBRA_STOCK_KEY,
  formatQuantity,
  groupStockByProject,
  stockItemHref,
  type StockItem,
} from "@/lib/stock";
import { SEM_OBRA_LABEL } from "@/lib/user-tasks";

type EstoqueViewProps = {
  items: StockItem[];
  projects: { id: string; name: string }[];
};

export function EstoqueView({ items, projects }: EstoqueViewProps) {
  const [projectId, setProjectId] = useState("all");
  const [query, setQuery] = useState("");

  const hasUnlinked = items.some((item) => !item.projectId);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (projectId === SEM_OBRA_STOCK_KEY) {
        if (item.projectId) return false;
      } else if (projectId !== "all" && item.projectId !== projectId) {
        return false;
      }
      if (needle && !item.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, projectId, query]);

  const groups = useMemo(() => groupStockByProject(filtered), [filtered]);
  const grandTotal = filtered.reduce((sum, item) => sum + (parseFloat(item.totalPrice || "0") || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-label">Obra</span>
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 w-auto min-w-48"
            >
              <option value="all">Todas</option>
              {hasUnlinked && <option value={SEM_OBRA_STOCK_KEY}>{SEM_OBRA_LABEL}</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </Select>
          </label>
          <label className="text-sm flex flex-col gap-1 min-w-56 flex-1">
            <span className="text-label">Buscar</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome"
                className="pl-9"
                aria-label="Buscar material por nome"
              />
            </span>
          </label>
        </div>
        {filtered.length > 0 && (
          <p className="text-sm font-data tabular-nums font-semibold">{formatBRL(grandTotal)}</p>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            illustration="tape"
            title="Nenhum material em estoque"
            description="Quando um material for marcado como comprado, ele aparece aqui agrupado pela obra."
            action={
              <Link prefetch href="/fornecedores" className={buttonVariants()}>
                Ver fornecedores
              </Link>
            }
          />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            illustration="plan"
            title="Nada neste recorte"
            description="Ajuste o filtro da obra ou o nome buscado para ver os materiais comprados."
          />
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.key} className="bg-white">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {group.items.length} {group.items.length === 1 ? "item" : "itens"}
                    {group.projectId ? (
                      <>
                        {" · "}
                        <Link prefetch href={`/obras/${group.projectId}`} className="underline-offset-2 hover:underline">
                          Ver obra
                        </Link>
                      </>
                    ) : null}
                  </CardDescription>
                </div>
                <p className="text-sm font-data tabular-nums font-semibold shrink-0">{formatBRL(group.total)}</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      prefetch
                      href={stockItemHref(item)}
                      className={cn(TASK_CHIP_CLASS, "flex flex-wrap items-center justify-between gap-3 px-3 py-2 hover:brightness-95")}
                      data-fill="white"
                      style={chipContrastStyle("white")}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                          {item.brand ? ` · ${item.brand}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[
                            formatQuantity(item.quantity, item.unit),
                            item.supplierName,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {item.purchaseDate && (
                          <span
                            className="ds-chip-surface ds-chip-pill text-[10px] font-mono px-2 py-0.5"
                            data-fill="concrete"
                            style={chipContrastStyle("concrete")}
                          >
                            {formatDatePtBR(item.purchaseDate)}
                          </span>
                        )}
                        <span className="text-sm font-data tabular-nums">{formatBRL(parseFloat(item.totalPrice || "0"))}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
