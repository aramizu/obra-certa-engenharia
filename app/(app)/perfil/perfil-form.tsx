"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ds";
import { afterMutation } from "@/lib/after-mutation";
import { avatarImageSrc, initialsFrom } from "@/lib/avatar";
import { processAvatarFile } from "@/lib/process-avatar";

export function PerfilForm({
  name,
  email,
  avatarVersion,
}: {
  name: string;
  email: string;
  avatarVersion: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(name);
  const [version, setVersion] = useState(avatarVersion);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = preview ?? avatarImageSrc(version);
  const initials = initialsFrom(fullName || name);

  const refresh = () => afterMutation(() => router.refresh());

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar nome");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar nome");
    } finally {
      setLoading(false);
    }
  };

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const processed = await processAvatarFile(file);
      const localUrl = URL.createObjectURL(processed.blob);
      setPreview(localUrl);
      const body = new FormData();
      body.append("avatar", processed.blob, processed.mime === "image/webp" ? "avatar.webp" : "avatar.jpg");
      const response = await fetch("/api/perfil/avatar", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao enviar foto");
      setVersion(data.version ?? null);
      setPreview(null);
      URL.revokeObjectURL(localUrl);
      await refresh();
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Erro ao processar a foto");
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/perfil/avatar", { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao remover foto");
      setVersion(null);
      setPreview(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover foto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex items-center gap-4">
        {src ? (
          <img
            src={src}
            alt="Foto de perfil"
            width={96}
            height={96}
            className="h-24 w-24 rounded-lg border-2 border-graphite object-cover bg-white"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-graphite bg-primary text-primary-foreground font-display text-3xl">
            {initials}
          </div>
        )}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/*"
            className="hidden"
            onChange={(event) => void onPick(event)}
          />
          <Button type="button" variant="outline" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? "Processando…" : "Trocar foto"}
          </Button>
          {version && (
            <Button type="button" variant="ghost" disabled={loading} onClick={() => void removePhoto()}>
              Remover foto
            </Button>
          )}
          <p className="text-xs text-muted-foreground">A foto é recortada em 96×96 no aparelho e enviada como bytes (WebP/JPEG).</p>
        </div>
      </div>

      <form onSubmit={saveName} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="perfil-name">Nome</Label>
          <Input
            id="perfil-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perfil-email">E-mail</Label>
          <Input id="perfil-email" value={email} disabled />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar nome"}
        </Button>
      </form>
    </div>
  );
}
