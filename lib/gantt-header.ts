import { addDays, diffDays, eachDay, formatISODate, startOfDay } from "./date";
import { WEEKDAY_LABELS, startOfWeekSunday } from "./calendar";

export type GanttZoom = "day" | "week" | "month";

export type GanttColumn = {
  key: string;
  date: Date;
  hour?: number;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function monthName(date: Date, style: "long" | "short") {
  const raw = date.toLocaleDateString("pt-BR", { month: style }).replace(/\./g, "").trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Folga da pílula em relação às divisórias de dia/hora, sem alterar as datas. */
export const GANTT_BAR_INSET_PX = 4;

export function ganttMinColumnPx(zoom: GanttZoom) {
  if (zoom === "month") return 56;
  if (zoom === "week") return 56;
  return 40;
}

export function ganttBarBoxStyle(startIndex: number, spanCount: number, colCount: number) {
  if (colCount <= 0 || spanCount <= 0) {
    return { left: "0px", width: "0px" };
  }
  const leftPct = (startIndex / colCount) * 100;
  const widthPct = (spanCount / colCount) * 100;
  return {
    left: `calc(${leftPct}% + ${GANTT_BAR_INSET_PX}px)`,
    width: `calc(${widthPct}% - ${GANTT_BAR_INSET_PX * 2}px)`,
  };
}

export function ganttColumns(zoom: GanttZoom, cursor: Date): GanttColumn[] {
  const day = startOfDay(cursor);
  if (zoom === "month") {
    const start = new Date(day.getFullYear(), day.getMonth(), 1);
    const end = new Date(day.getFullYear(), day.getMonth() + 1, 0);
    return eachDay(start, end).map((date) => ({ key: formatISODate(date), date }));
  }
  if (zoom === "week") {
    const start = startOfWeekSunday(day);
    return eachDay(start, addDays(start, 6)).map((date) => ({ key: formatISODate(date), date }));
  }
  return Array.from({ length: 24 }, (_, index) => {
    const hour = index + 1;
    return {
      key: `${formatISODate(day)}-${pad2(hour)}`,
      date: day,
      hour,
    };
  });
}

/** Relógio JS 0–23 → coluna 1h–24h (0h vira 24h). */
export function ganttClockHourToColumn(jsHour: number) {
  if (jsHour <= 0) return 24;
  if (jsHour >= 24) return 24;
  return jsHour;
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * Posição da linha do momento atual: índice da coluna + fração dentro dela.
 * Dia: proporcional ao minuto na coluna da hora. Semana/mês: proporcional à hora do dia.
 */
export function ganttNowLineOffset(
  zoom: GanttZoom,
  columns: GanttColumn[],
  now: Date
): { index: number; progress: number } | null {
  if (columns.length === 0) return null;
  if (zoom === "day") {
    if (!isSameDay(columns[0].date, now)) return null;
    const index = columns.findIndex((column) => column.hour === ganttClockHourToColumn(now.getHours()));
    if (index < 0) return null;
    return { index, progress: now.getMinutes() / 60 };
  }
  const index = columns.findIndex((column) => isSameDay(column.date, now));
  if (index < 0) return null;
  return { index, progress: (now.getHours() * 60 + now.getMinutes()) / (24 * 60) };
}

export function formatGanttHeaderTop(zoom: GanttZoom, start: Date, end: Date = start): string {
  if (zoom === "month") {
    return `${monthName(start, "long")} ${start.getFullYear()}`;
  }
  if (zoom === "week") {
    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${monthName(start, "long")} (${pad2(start.getDate())}-${pad2(end.getDate())}) ${start.getFullYear()}`;
    }
    if (start.getFullYear() === end.getFullYear()) {
      return `${monthName(start, "short")} (${pad2(start.getDate())}) - ${monthName(end, "short")} (${pad2(end.getDate())}) ${end.getFullYear()}`;
    }
    return `${monthName(start, "short")} (${pad2(start.getDate())}) ${start.getFullYear()} - ${monthName(end, "short")} (${pad2(end.getDate())}) ${end.getFullYear()}`;
  }
  return `${pad2(start.getDate())}/${pad2(start.getMonth() + 1)}/${start.getFullYear()}`;
}

export function formatGanttHeaderBottom(zoom: GanttZoom, date: Date, hour = 1): string {
  if (zoom === "month" || zoom === "week") {
    return `${pad2(date.getDate())}-${WEEKDAY_LABELS[date.getDay()]}`;
  }
  return `${hour}h`;
}

export function ganttBarColumnSpan(
  zoom: GanttZoom,
  columns: GanttColumn[],
  start: Date,
  end: Date
): { startIndex: number; endIndex: number } | null {
  if (columns.length === 0) return null;
  if (zoom === "day") {
    const day = startOfDay(columns[0].date);
    if (startOfDay(end) < day || startOfDay(start) > day) return null;
    return { startIndex: 0, endIndex: columns.length - 1 };
  }
  const windowStart = startOfDay(columns[0].date);
  const windowEnd = startOfDay(columns[columns.length - 1].date);
  const from = startOfDay(start);
  const to = startOfDay(end);
  if (to < windowStart || from > windowEnd) return null;
  const startIndex = Math.max(0, diffDays(from, windowStart));
  const endIndex = Math.min(columns.length - 1, diffDays(to, windowStart));
  return { startIndex, endIndex };
}

export function shiftGanttCursor(cursor: Date, zoom: GanttZoom, direction: number): Date {
  const next = startOfDay(cursor);
  if (zoom === "month") {
    return new Date(next.getFullYear(), next.getMonth() + direction, 1);
  }
  if (zoom === "week") return addDays(next, direction * 7);
  return addDays(next, direction);
}
