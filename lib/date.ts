const DAY_MS = 86_400_000;

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);
}

export function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function today(): Date {
  return startOfDay(new Date());
}

export const APP_TIME_ZONE = "America/Sao_Paulo";

/** Data civil no fuso da obra (padrão: São Paulo). */
export function todayInTimeZone(timeZone = APP_TIME_ZONE): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parseISODate(iso);
}

/** Segunda-feira da semana que contém `date` (domingo fecha a semana). */
export function startOfWeekMonday(date: Date): Date {
  const start = startOfDay(date);
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + offset);
  return start;
}

export function endOfWeekSunday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 6);
}

export function formatDatePtBR(iso: string) {
  return parseISODate(iso).toLocaleDateString("pt-BR");
}
