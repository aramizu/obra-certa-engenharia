"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn, iconStroke } from "./cn";
import { Stamp } from "./stamp";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex h-full w-80 max-w-[90vw] flex-col border-r-2 border-graphite bg-white ds-shadow">
        <div className="ds-hazard h-2 w-full" />
        <div className="flex items-center justify-between border-b-2 border-graphite bg-blueprint-wash px-4 py-3">
          <div className="space-y-1">
            <Stamp>MENU</Stamp>
            <h2 className="text-title">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn("border-2 border-graphite bg-white p-1 hover:bg-concrete", iconStroke)}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
