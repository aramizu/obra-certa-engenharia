"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "./category-dialog";

interface CreateCategoryButtonProps {
  projectId: string;
}

export function CreateCategoryButton({ projectId }: CreateCategoryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Nova Categoria
      </Button>
      <CategoryDialog open={open} onOpenChange={setOpen} projectId={projectId} />
    </>
  );
}
