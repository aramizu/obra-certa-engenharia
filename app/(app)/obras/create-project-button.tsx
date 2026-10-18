"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CreateProjectButton() {
  return (
    <Link href="/obras/nova" prefetch className={cn(buttonVariants(), "gap-2")}>
      <Plus className="h-4 w-4" />
      Nova Obra
    </Link>
  );
}
