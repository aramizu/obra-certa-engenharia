"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn, iconStroke } from "./cn";
import { Stamp } from "./stamp";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
}

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useDialogContext();

  if (asChild && React.isValidElement(children)) {
    const element = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(element, {
      onClick: (e: React.MouseEvent) => {
        element.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }

  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 flex w-full max-w-lg isolate rounded-lg bg-white text-foreground border-2 border-graphite ds-shadow",
          "[&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col [&>form]:overflow-hidden",
          className,
          "max-h-[calc(100dvh-2rem)] flex-col overflow-hidden"
        )}
      >
        <div className="ds-hazard-orange h-2 w-full shrink-0" />
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={cn(
            "absolute right-3 top-5 z-10 rounded-md border-2 border-graphite bg-white p-1 text-foreground hover:bg-concrete",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            iconStroke
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col space-y-1 border-b-2 border-graphite bg-blueprint-wash px-6 py-3 pr-14 sm:space-y-1.5 sm:py-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <Stamp>PRANCHA</Stamp>
      </div>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-title text-foreground leading-none", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-3 border-t-2 border-graphite bg-white", className)}>
      {children}
    </div>
  );
}
