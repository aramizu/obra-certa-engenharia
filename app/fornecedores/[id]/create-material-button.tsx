"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialDialog } from "./material-dialog";

interface CreateMaterialButtonProps {
  supplierId: string;
  projects: Array<{ id: string; name: string }>;
}

export function CreateMaterialButton({ supplierId, projects }: CreateMaterialButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Material
      </Button>
      <MaterialDialog 
        open={open} 
        onOpenChange={setOpen} 
        supplierId={supplierId}
        projects={projects}
      />
    </>
  );
}
