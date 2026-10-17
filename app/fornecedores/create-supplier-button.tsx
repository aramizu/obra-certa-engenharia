"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "./supplier-dialog";

export function CreateSupplierButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Fornecedor
      </Button>
      <SupplierDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
