export { cn } from "@/lib/utils";

/** Raio dos controles (botão Sair, input, select): --radius-md = 12px. */
export const CONTROL_RADIUS_CLASS = "rounded-md";
/** Painel aberto de dropdown/menu: mesmo raio do trigger. */
export const MENU_PANEL_RADIUS_CLASS = "rounded-md";
/** Itens do menu: um degrau menor (--radius-sm = 10px). */
export const MENU_ITEM_RADIUS_CLASS = "rounded-sm";

export const fieldClass =
  "flex w-full rounded-md border-2 border-graphite bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Trigger de select nativo: appearance-none, px-3 à esquerda, pr-9 à direita
 * (px-3 + gap-2 + ícone 16px) para a seta ficar a right-3, igual ao padding do texto.
 */
export const selectTriggerClass = `${fieldClass} h-10 cursor-pointer appearance-none bg-white px-3 pr-9`;

export const menuPanelClass =
  "overflow-hidden rounded-md bg-white border-2 border-graphite ds-shadow z-20";

export const menuItemClass =
  "flex items-center gap-2 w-full rounded-sm mx-1 px-3 py-2 text-sm hover:bg-concrete";

export const iconStroke = "[&_svg]:stroke-[2.25]";
