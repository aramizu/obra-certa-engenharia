"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { afterMutation } from "@/lib/after-mutation";

export function ArchivedObraBanner({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const unarchive = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/obras/${projectId}/arquivo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!response.ok) {
        throw new Error("Erro ao desarquivar obra");
      }
      await afterMutation(() => router.refresh(), { projectId });
    } catch (error) {
      console.error("Error unarchiving project:", error);
      alert("Erro ao desarquivar obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert tone="warning" title="Obra arquivada">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>Esta obra está arquivada. Os dados permanecem visíveis, mas não podem ser editados.</p>
        <Button type="button" size="sm" onClick={() => void unarchive()} disabled={loading}>
          {loading ? "Desarquivando..." : "Desarquivar"}
        </Button>
      </div>
    </Alert>
  );
}
