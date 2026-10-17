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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg isolate bg-white text-foreground border-2 border-graphite ds-shadow ds-chamfer",
          className
        )}
      >
        <div className="ds-hazard-orange h-2 w-full" />
        <button
          onClick={() => onOpenChange(false)}
          className={cn(
            "absolute right-3 top-5 border-2 border-graphite bg-white p-1 text-foreground hover:bg-concrete",
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
    <div className={cn("flex flex-col space-y-1.5 border-b-2 border-graphite bg-blueprint-wash px-6 py-4 pr-14", className)}>
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

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t-2 border-graphite bg-white", className)}>
      {children}
    </div>
  );
}
