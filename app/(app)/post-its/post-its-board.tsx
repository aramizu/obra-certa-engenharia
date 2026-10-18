"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CHIP_SURFACE_CLASS, EmptyState, PILL_CHIP_CLASS, Select, TASK_CHIP_RADIUS_CLASS, chipSurfaceProps } from "@/components/ds";
import { afterMutation } from "@/lib/after-mutation";
import {
  DEFAULT_NOTE_COLOR,
  NOTE_COLORS,
  applyNoteMove,
  dropIndexFromPoint,
  noteFill,
  noteRotationDeg,
  noteTapeRotationDeg,
  resolveNoteColorId,
  type NoteColorId,
} from "@/lib/notes";
import { shouldActivateDrag } from "@/lib/kanban-dnd";
import type { Note } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type BoardNote = Note;

const FILTER_ALL = "all";
const FILTER_FREE = "none";

export function PostItsBoard({
  initialNotes,
  projects,
  defaultProjectId = null,
}: {
  initialNotes: BoardNote[];
  projects: { id: string; name: string }[];
  defaultProjectId?: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [filter, setFilter] = useState(defaultProjectId ?? FILTER_ALL);
  const [deleting, setDeleting] = useState<BoardNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    index: number;
  } | null>(null);

  useEffect(() => setNotes(initialNotes), [initialNotes]);

  const visible = useMemo(() => {
    const list = [...notes].sort((a, b) => a.position - b.position);
    if (filter === FILTER_ALL) return list;
    if (filter === FILTER_FREE) return list.filter((note) => !note.projectId);
    return list.filter((note) => note.projectId === filter);
  }, [filter, notes]);

  const persistOrderRef = useRef<(next: BoardNote[]) => void>(() => {});
  persistOrderRef.current = (next) => {
    void (async () => {
      await fetch("/api/post-its", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.sort((a, b) => a.position - b.position).map((note) => note.id) }),
      });
      await afterMutation(() => router.refresh());
    })();
  };

  const sessionRef = useRef<{
    pointerId: number;
    id: string;
    originX: number;
    originY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const suppressClickRef = useRef<string | null>(null);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [role='combobox']")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    sessionRef.current = {
      pointerId: event.pointerId,
      id,
      originX: event.clientX,
      originY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  useEffect(() => {
    const hitIndex = (x: number, y: number, draggedId: string) => {
      const rects = Array.from(document.querySelectorAll<HTMLElement>("[data-note-id]")).map((node) => {
        const rect = node.getBoundingClientRect();
        return { id: node.dataset.noteId!, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      });
      return dropIndexFromPoint(rects, x, y, draggedId);
    };

    const onMove = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;
      const active = dragRef.current;
      if (!active) {
        if (!shouldActivateDrag(session.originX, session.originY, event.clientX, event.clientY)) return;
        event.preventDefault();
        const next = {
          id: session.id,
          x: event.clientX,
          y: event.clientY,
          width: session.width,
          height: session.height,
          offsetX: session.offsetX,
          offsetY: session.offsetY,
          index: hitIndex(event.clientX, event.clientY, session.id),
        };
        dragRef.current = next;
        setDrag(next);
        return;
      }
      event.preventDefault();
      const next = { ...active, x: event.clientX, y: event.clientY, index: hitIndex(event.clientX, event.clientY, session.id) };
      dragRef.current = next;
      setDrag(next);
    };

    const onUp = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;
      sessionRef.current = null;
      const active = dragRef.current;
      if (!active) return;
      event.preventDefault();
      suppressClickRef.current = session.id;
      dragRef.current = null;
      setDrag(null);
      const snapshot = notesRef.current;
      const next = applyNoteMove(snapshot, session.id, active.index);
      notesRef.current = next;
      setNotes(next);
      persistOrderRef.current(next);
    };

    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };
  }, []);

  const createNote = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/post-its", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          color: DEFAULT_NOTE_COLOR,
          projectId: filter !== FILTER_ALL && filter !== FILTER_FREE ? filter : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao criar");
      setNotes((current) => [...current, result.note]);
      await afterMutation(() => router.refresh());
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao criar post-it");
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (id: string, patch: Partial<BoardNote>) => {
    const response = await fetch(`/api/post-its/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erro ao salvar");
    setNotes((current) => current.map((note) => (note.id === id ? result.note : note)));
    await afterMutation(() => router.refresh(), { projectId: result.note.projectId });
  };

  const removeNote = async () => {
    if (!deleting) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/post-its/${deleting.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro ao excluir");
      setNotes((current) => current.filter((note) => note.id !== deleting.id));
      setDeleting(null);
      await afterMutation(() => router.refresh(), { projectId: deleting.projectId });
    } catch {
      alert("Erro ao excluir post-it");
    } finally {
      setLoading(false);
    }
  };

  const dragged = drag ? notes.find((note) => note.id === drag.id) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm flex items-center gap-2">
          <span className="text-label">Notas</span>
          <Select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-auto min-w-44 bg-white"
            label="Notas"
          >
            <option value={FILTER_ALL}>Todas as notas</option>
            <option value={FILTER_FREE}>Notas livres</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </label>
        <Button onClick={() => void createNote()} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Novo post-it
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          illustration="tape"
          title="Mural vazio"
          description="Pregue um post-it com lembretes. Dá para arrastar, recortar a cor e ligar a uma obra ou deixar como nota livre."
          action={
            <Button onClick={() => void createNote()} disabled={loading}>
              Adicionar post-it
            </Button>
          }
        />
      ) : (
        <div className={`grid gap-8 pt-5 overflow-visible sm:grid-cols-2 xl:grid-cols-3 ${drag ? "select-none cursor-grabbing" : ""}`}>
          {visible.map((note) => (
            <PostItCard
              key={note.id}
              note={note}
              projects={projects}
              dimmed={drag?.id === note.id}
              onPointerDown={onPointerDown}
              onSave={saveNote}
              onDelete={() => setDeleting(note)}
            />
          ))}
        </div>
      )}

      {drag &&
        dragged &&
        createPortal(
          <div
            aria-hidden
            className="fixed z-50 pointer-events-none overflow-visible pt-4"
            style={{
              left: drag.x - drag.offsetX,
              top: drag.y - drag.offsetY - 16,
              width: drag.width,
              transform: `rotate(${noteRotationDeg(dragged.id)}deg)`,
            }}
          >
            <PostItFace note={dragged} />
          </div>,
          document.body
        )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Excluir post-it"
        description={
          <>
            Apagar {deleting?.title?.trim() ? <strong>{deleting.title}</strong> : "esta nota"}? Isso não pode ser desfeito.
          </>
        }
        loading={loading}
        onConfirm={() => void removeNote()}
      />
    </div>
  );
}

function PostItFace({ note, children }: { note: BoardNote; children?: ReactNode }) {
  const surface = chipSurfaceProps(noteFill(note.color));
  return (
    <div
      className={cn(
        CHIP_SURFACE_CLASS,
        TASK_CHIP_RADIUS_CLASS,
        "relative overflow-visible ds-shadow p-4 pt-6 min-h-[12rem]"
      )}
      style={surface.style}
    >
      <span
        aria-hidden
        className="ds-sticky-tape"
        style={{ transform: `translateX(-50%) rotate(${noteTapeRotationDeg(note.id)}deg)` }}
      />
      {children}
    </div>
  );
}

function PostItCard({
  note,
  projects,
  dimmed,
  onPointerDown,
  onSave,
  onDelete,
}: {
  note: BoardNote;
  projects: { id: string; name: string }[];
  dimmed: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, id: string) => void;
  onSave: (id: string, patch: Partial<BoardNote>) => Promise<void>;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const color = resolveNoteColorId(note.color) as NoteColorId;

  useEffect(() => {
    setTitle(note.title ?? "");
    setContent(note.content);
  }, [note.content, note.title]);

  return (
    <article
      data-note-id={note.id}
      onPointerDown={(event) => onPointerDown(event, note.id)}
      className={cn("cursor-grab overflow-visible", dimmed && "opacity-40")}
      style={{ transform: `rotate(${noteRotationDeg(note.id)}deg)`, touchAction: "none" }}
    >
      <PostItFace note={note}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <input
            value={title}
            placeholder="Título (opcional)"
            className="flex-1 bg-transparent text-sm font-semibold placeholder:text-foreground/50 focus:outline-none"
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              if ((note.title ?? "") !== title.trim()) void onSave(note.id, { title: title.trim() || null });
            }}
          />
          <button type="button" className="p-1 hover:bg-black/5 rounded-md" aria-label="Excluir post-it" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={content}
          placeholder="Escreva o recado…"
          rows={5}
          className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-foreground/45 focus:outline-none"
          onChange={(event) => setContent(event.target.value)}
          onBlur={() => {
            if (content !== note.content) void onSave(note.id, { content });
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Cor do post-it">
            {NOTE_COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={item.id === color}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  PILL_CHIP_CLASS,
                  "h-5 w-5 p-0",
                  item.id === color ? "ring-2 ring-graphite ring-offset-1" : ""
                )}
                style={chipSurfaceProps(item.fill).style}
                onClick={() => {
                  if (item.id !== color) void onSave(note.id, { color: item.id });
                }}
              />
            ))}
          </div>
          <Select
            className="max-w-[10rem] h-7 text-xs"
            value={note.projectId ?? ""}
            onChange={(event) => void onSave(note.id, { projectId: event.target.value || null })}
            label="Obra"
          >
            <option value="">Nota livre</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </div>
      </PostItFace>
    </article>
  );
}
