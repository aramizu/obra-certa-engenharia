"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn, iconStroke, menuItemClass, menuPanelClass, selectTriggerClass } from "./cn";

export const SELECT_LAYER_Z = 80;
const MOBILE_MQ = "(max-width: 767px)";

export type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
};

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  placeholder?: string;
  label?: string;
}

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) {
    return textOf((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

export function optionsFromSelectChildren(children: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  const walk = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === React.Fragment) {
        walk((child.props as { children?: React.ReactNode }).children);
        return;
      }
      if (child.type === "optgroup") {
        walk((child.props as { children?: React.ReactNode }).children);
        return;
      }
      if (child.type === "option") {
        const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement> & {
          children?: React.ReactNode;
        };
        const label = textOf(props.children);
        out.push({
          value: props.value != null ? String(props.value) : label,
          label,
          disabled: Boolean(props.disabled),
        });
      }
    });
  };
  walk(children);
  return out;
}

function cleanTitle(value: string) {
  return value.replace(/\s+\*$/, "").replace(/\s+/g, " ").trim();
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      required,
      name,
      id,
      placeholder,
      label,
      form,
      autoFocus,
      ...rest
    },
    ref
  ) => {
    const options = React.useMemo(() => optionsFromSelectChildren(children), [children]);
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState(() =>
      String(defaultValue ?? value ?? options[0]?.value ?? "")
    );
    const current = String(isControlled ? value : uncontrolled);
    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [title, setTitle] = React.useState(label ?? "");
    const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({});
    const [mounted, setMounted] = React.useState(false);
    const mobile = useIsMobile();
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const nativeRef = React.useRef<HTMLSelectElement>(null);
    const searchRef = React.useRef("");
    const searchTimer = React.useRef<number>(0);
    const listId = React.useId();

    React.useEffect(() => setMounted(true), []);

    const selected = options.find((option) => option.value === current);
    const display = selected?.label || placeholder || "";
    const isPlaceholder = !selected && Boolean(placeholder);

    const commit = React.useCallback(
      (next: string) => {
        if (!isControlled) setUncontrolled(next);
        const native = nativeRef.current;
        onChange?.({
          target: { value: next, name: name ?? "", id: id ?? "" },
          currentTarget: native ?? ({ value: next, name: name ?? "" } as HTMLSelectElement),
        } as React.ChangeEvent<HTMLSelectElement>);
      },
      [id, isControlled, name, onChange]
    );

    const close = React.useCallback(() => {
      setOpen(false);
      triggerRef.current?.focus();
    }, []);

    const resolveTitle = React.useCallback(() => {
      if (label) return cleanTitle(label);
      if (id) {
        const labelled = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (labelled?.textContent) return cleanTitle(labelled.textContent);
      }
      const wrap = triggerRef.current?.closest("label");
      if (wrap) {
        const clone = wrap.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("button, select, input, textarea, [role='listbox']").forEach((node) => node.remove());
        const text = cleanTitle(clone.textContent || "");
        if (text) return text;
      }
      return placeholder || "Selecionar";
    }, [id, label, placeholder]);

    const updatePanelPosition = React.useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 4;
      const maxHeight = 280;
      const below = window.innerHeight - rect.bottom - gap;
      const above = rect.top - gap;
      const openUp = below < 160 && above > below;
      const height = Math.min(maxHeight, Math.max(120, (openUp ? above : below) - 8));
      setPanelStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        maxHeight: height,
        zIndex: SELECT_LAYER_Z,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
      });
    }, []);

    React.useEffect(() => {
      if (!open) return;
      setTitle(resolveTitle());
      const selectedIndex = Math.max(0, options.findIndex((option) => option.value === current && !option.disabled));
      setActiveIndex(selectedIndex === -1 ? 0 : selectedIndex);
      updatePanelPosition();
      requestAnimationFrame(() => panelRef.current?.focus());
      const onScroll = () => updatePanelPosition();
      window.addEventListener("resize", updatePanelPosition);
      document.addEventListener("scroll", onScroll, true);
      return () => {
        window.removeEventListener("resize", updatePanelPosition);
        document.removeEventListener("scroll", onScroll, true);
      };
    }, [current, open, options, resolveTitle, updatePanelPosition]);

    React.useEffect(() => {
      if (!open) return;
      const option = panelRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
      option?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    React.useEffect(() => {
      if (!open) return;
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
          return;
        }
        if (event.key === "Tab") {
          setOpen(false);
          return;
        }
        const enabled = options
          .map((option, index) => ({ option, index }))
          .filter((entry) => !entry.option.disabled);
        if (enabled.length === 0) return;
        const currentPos = Math.max(0, enabled.findIndex((entry) => entry.index === activeIndex));
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveIndex(enabled[Math.min(currentPos + 1, enabled.length - 1)]!.index);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveIndex(enabled[Math.max(currentPos - 1, 0)]!.index);
        } else if (event.key === "Home") {
          event.preventDefault();
          setActiveIndex(enabled[0]!.index);
        } else if (event.key === "End") {
          event.preventDefault();
          setActiveIndex(enabled[enabled.length - 1]!.index);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const option = options[activeIndex];
          if (option && !option.disabled) {
            commit(option.value);
            close();
          }
        } else if (event.key.length === 1 && event.key !== " ") {
          searchRef.current += event.key.toLowerCase();
          window.clearTimeout(searchTimer.current);
          searchTimer.current = window.setTimeout(() => {
            searchRef.current = "";
          }, 500);
          const match = options.findIndex(
            (option) => !option.disabled && option.label.toLowerCase().startsWith(searchRef.current)
          );
          if (match >= 0) setActiveIndex(match);
        }
      };
      document.addEventListener("keydown", onKey, true);
      return () => document.removeEventListener("keydown", onKey, true);
    }, [activeIndex, close, commit, open, options]);

    const pick = (option: SelectOption) => {
      if (option.disabled) return;
      commit(option.value);
      close();
    };

    const setNativeRef = (node: HTMLSelectElement | null) => {
      nativeRef.current = node;
      assignRef(ref, node);
    };

    const optionButtons = options.map((option, index) => {
      const selectedOption = option.value === current;
      return (
        <button
          key={`${option.value}-${index}`}
          type="button"
          role="option"
          id={`${listId}-${index}`}
          data-index={index}
          aria-selected={selectedOption}
          disabled={option.disabled}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => pick(option)}
          className={cn(
            menuItemClass,
            "w-[calc(100%-0.5rem)] justify-between text-left",
            mobile ? "min-h-12 px-4 py-3 text-base" : "min-h-9",
            index === activeIndex && "bg-concrete",
            option.disabled && "opacity-50"
          )}
        >
          <span className="min-w-0 truncate">{option.label || placeholder || "—"}</span>
          {selectedOption ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : <span className="h-4 w-4 shrink-0" />}
        </button>
      );
    });

    const layer = open && mounted
      ? createPortal(
          <>
            <div
              className={cn("fixed inset-0 z-[79]", mobile ? "bg-black/50" : "bg-transparent")}
              onPointerDown={() => setOpen(false)}
              aria-hidden
            />
            {mobile ? (
              <div
                ref={panelRef}
                role="listbox"
                id={listId}
                tabIndex={-1}
                aria-labelledby={id}
                className="fixed inset-x-0 bottom-0 z-[80] flex max-h-[80dvh] flex-col rounded-t-md border-2 border-graphite bg-white ds-shadow outline-none"
                style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
              >
                <div className="border-b-2 border-graphite bg-blueprint-wash px-4 py-3">
                  <p className="text-title">{title}</p>
                </div>
                <div className="overflow-y-auto overscroll-contain py-1">{optionButtons}</div>
              </div>
            ) : (
              <div
                ref={panelRef}
                role="listbox"
                id={listId}
                tabIndex={-1}
                aria-labelledby={id}
                className={cn(menuPanelClass, "z-[80] overflow-y-auto overscroll-contain py-1 bg-white outline-none")}
                style={panelStyle}
              >
                {optionButtons}
              </div>
            )}
          </>,
          document.body
        )
      : null;

    return (
      <span className={cn("relative inline-flex min-w-0 items-center", iconStroke, className)}>
        <select
          ref={setNativeRef}
          id={id ? `${id}-native` : undefined}
          name={name}
          form={form}
          required={required}
          disabled={disabled}
          value={current}
          tabIndex={-1}
          aria-hidden
          data-ds-native-select=""
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
          onChange={(event) => commit(event.target.value)}
          onBlur={onBlur}
          onInvalid={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          {...rest}
        >
          {options.map((option, index) => (
            <option key={`${option.value}-${index}`} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          autoFocus={autoFocus}
          onClick={() => {
            if (disabled) return;
            setOpen((currentOpen) => !currentOpen);
          }}
          className={cn(selectTriggerClass, "relative w-full text-left", className)}
        >
          <span className={cn("min-w-0 flex-1 truncate", isPlaceholder && "text-muted-foreground")}>
            {display}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground",
              open && "rotate-180"
            )}
          />
        </button>
        {layer}
      </span>
    );
  }
);
Select.displayName = "Select";

export { Select };
