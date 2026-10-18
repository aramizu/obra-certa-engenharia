"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ds";
import type { Project } from "@/lib/db/schema";
import { Calendar, MapPin } from "lucide-react";

interface ProjectsListProps {
  projects: Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration="plan"
          title="Nenhuma obra cadastrada"
          description="Clique em Nova Obra para abrir a primeira prancha do canteiro."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/obras/${project.id}`} prefetch>
          <Card className="h-full hover:border-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">{project.name}</CardTitle>
              {project.address && (
                <CardDescription className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  {project.address}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Orçamento Total</p>
                <p className="text-xl font-data tabular-nums font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(parseFloat(project.totalBudget))}
                </p>
              </div>
              
              {(project.startDate || project.targetEndDate) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {project.startDate && (
                    <span>
                      {new Date(project.startDate + "T00:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}
                  {project.startDate && project.targetEndDate && <span>→</span>}
                  {project.targetEndDate && (
                    <span>
                      {new Date(project.targetEndDate + "T00:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
