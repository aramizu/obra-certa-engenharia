"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, PILL_CHIP_CLASS, chipContrastStyle } from "@/components/ds";
import { formatBRL } from "@/lib/format";
import { getUnitLabel } from "@/lib/material-units";
import {
  ITEM_STATUS_FILL,
  ITEM_STATUS_LABEL,
  normalizeItemStatus,
  parseMoney,
} from "@/lib/item-status";

interface MaterialData {
  id: string;
  projectId: string;
  budgetCategoryId: string | null;
  name: string;
  brand: string | null;
  unit: string | null;
  quantityPerUnit: string | null;
  quantity: string | null;
  unitPrice: string | null;
  totalPrice: string | null;
  status: string;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: Date;
  projectName: string;
  categoryName: string | null;
}

interface MaterialsListProps {
  materials: MaterialData[];
}

export function MaterialsList({ materials }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum item vinculado. Cadastre itens na obra e escolha este fornecedor ao cotar ou comprar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => {
        const status = normalizeItemStatus(material.status);
        const fill = ITEM_STATUS_FILL[status];
        const qty = parseMoney(material.quantity);
        const unitLabel = material.unit ? getUnitLabel(material.unit) : "";
        const unitPrice = parseMoney(material.unitPrice);
        const total = parseMoney(material.totalPrice);

        return (
          <Card key={material.id} className="bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold">
                    <Link prefetch href={`/obras/${material.projectId}`} className="hover:underline">
                      {material.name}
                    </Link>
                    {material.brand && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({material.brand})
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge>
                      <Link prefetch href={`/obras/${material.projectId}`} className="hover:underline">
                        {material.projectName}
                      </Link>
                    </Badge>
                    {material.categoryName && (
                      <Badge tone="blueprint">{material.categoryName}</Badge>
                    )}
                    <span
                      className={`${PILL_CHIP_CLASS} px-2 py-0.5 text-[10px] font-display uppercase tracking-widest`}
                      data-fill={fill}
                      style={chipContrastStyle(fill)}
                    >
                      {ITEM_STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Quantidade</p>
                  <p className="font-data tabular-nums font-medium">
                    {qty == null ? "—" : `${qty} ${unitLabel}`.trim()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Preço un.</p>
                  <p className="font-data tabular-nums font-medium">
                    {unitPrice == null ? "—" : formatBRL(unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-data tabular-nums font-semibold">
                    {total == null ? "—" : formatBRL(total)}
                  </p>
                </div>
                {material.purchaseDate && (
                  <div>
                    <p className="text-muted-foreground text-xs">Data compra</p>
                    <p className="font-medium">
                      {new Date(material.purchaseDate + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
              {material.notes && (
                <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
                  {material.notes}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
