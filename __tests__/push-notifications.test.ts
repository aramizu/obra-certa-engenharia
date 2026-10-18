import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hourInTimeZone, todayInTimeZone, formatISODate, APP_TIME_ZONE } from "@/lib/date";
import {
  applyNotifyPrefs,
  flagsFromNotifyWhen,
  filterUnsentDueItems,
  isGonePushStatus,
  kindForDueDate,
  normalizeNotifyHour,
  notifyWhenFromFlags,
  shouldSendAtHour,
  summarizeDuePush,
} from "@/lib/push";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("resumo do aviso de vencimento", () => {
  it("monta o texto com atrasada(s) e o exemplo do spec", () => {
    expect(summarizeDuePush({ today: 2, overdue: 1, tomorrow: 3 })).toBe(
      "Hoje: 2 vencem, 1 atrasada · Amanhã: 3"
    );
    expect(summarizeDuePush({ today: 1, overdue: 2, tomorrow: 0 })).toBe(
      "Hoje: 1 vence, 2 atrasadas"
    );
    expect(summarizeDuePush({ today: 0, overdue: 1, tomorrow: 0 })).toBe("Hoje: 1 atrasada");
    expect(summarizeDuePush({ today: 0, overdue: 0, tomorrow: 3 })).toBe("Amanhã: 3");
    expect(summarizeDuePush({ today: 0, overdue: 0, tomorrow: 0 })).toBeNull();
    expect(summarizeDuePush({ today: 2, overdue: 1, tomorrow: 3 })).not.toMatch(/vencida/);
  });
});

describe("classificação e preferências", () => {
  it("separa hoje, amanhã e atrasadas pela data em São Paulo", () => {
    expect(kindForDueDate("2026-10-18", "2026-10-18")).toBe("today");
    expect(kindForDueDate("2026-10-19", "2026-10-18")).toBe("tomorrow");
    expect(kindForDueDate("2026-10-17", "2026-10-18")).toBe("overdue");
    expect(kindForDueDate("2026-10-20", "2026-10-18")).toBeNull();
  });

  it("respeita quando avisar e o switch de atrasadas", () => {
    const items = [
      { taskId: "a", kind: "today" as const },
      { taskId: "b", kind: "tomorrow" as const },
      { taskId: "c", kind: "overdue" as const },
    ];
    expect(
      applyNotifyPrefs(items, { ...flagsFromNotifyWhen("both"), notifyOverdue: true })
    ).toHaveLength(3);
    expect(
      applyNotifyPrefs(items, { ...flagsFromNotifyWhen("due_day"), notifyOverdue: false }).map(
        (item) => item.kind
      )
    ).toEqual(["today"]);
    expect(
      applyNotifyPrefs(items, { ...flagsFromNotifyWhen("day_before"), notifyOverdue: true }).map(
        (item) => item.kind
      )
    ).toEqual(["tomorrow", "overdue"]);
    expect(notifyWhenFromFlags(true, true)).toBe("both");
    expect(notifyWhenFromFlags(true, false)).toBe("due_day");
    expect(notifyWhenFromFlags(false, true)).toBe("day_before");
  });

  it("deduplica por tarefa/kind no dia e envia só na hora configurada", () => {
    const pending = filterUnsentDueItems(
      [
        { taskId: "a", kind: "overdue" },
        { taskId: "b", kind: "today" },
      ],
      [{ taskId: "a", kind: "overdue" }]
    );
    expect(pending).toEqual([{ taskId: "b", kind: "today" }]);
    expect(shouldSendAtHour(8, 8)).toBe(true);
    expect(shouldSendAtHour(8, 11)).toBe(false);
    expect(normalizeNotifyHour(99)).toBe(8);
    expect(isGonePushStatus(410)).toBe(true);
    expect(isGonePushStatus(404)).toBe(true);
    expect(isGonePushStatus(500)).toBe(false);
  });
});

describe("fuso America/Sao_Paulo", () => {
  it("converte 11:30 UTC em 08:30 de Brasília (sem horário de verão)", () => {
    const now = new Date("2026-10-18T11:30:00.000Z");
    expect(APP_TIME_ZONE).toBe("America/Sao_Paulo");
    expect(hourInTimeZone(APP_TIME_ZONE, now)).toBe(8);
    expect(formatISODate(todayInTimeZone(APP_TIME_ZONE, now))).toBe("2026-10-18");
  });
});

describe("arquivos de push", () => {
  it("service worker só trata push e clique, sem cache offline", () => {
    const sw = source("public/sw.js");
    expect(sw).toContain('addEventListener("push"');
    expect(sw).toContain('addEventListener("notificationclick"');
    expect(sw).toContain("/kanban");
    expect(sw).not.toMatch(/caches/);
    expect(sw).not.toMatch(/addEventListener\(\s*["']fetch["']/);
  });

  it("manifest standalone com o nome da obra e cron horário", () => {
    const manifest = source("public/manifest.webmanifest");
    expect(manifest).toContain('"name": "Obra Certa Engenharia"');
    expect(manifest).toContain('"display": "standalone"');
    expect(manifest).toContain("/images/construction-bg.jpg");
    const vercel = source("vercel.json");
    expect(vercel).toContain("/api/cron/vencimentos");
    expect(vercel).toContain("0 * * * *");
  });

  it("migration 0013 é idempotente e o env obrigatório não inclui VAPID/CRON", () => {
    const sql = source("migrations/0013_push_notifications.sql");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS \"push_subscriptions\"");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS \"task_notifications\"");
    expect(sql).toContain("ON DELETE cascade");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS \"notify_hour\"");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS \"notify_overdue\"");
    const env = source("lib/env.ts");
    expect(env).not.toContain("VAPID");
    expect(env).not.toContain("CRON_SECRET");
    expect(env).not.toContain("BEGIN PRIVATE KEY");
  });

  it("perfil tem a seção Notificações com o switch de atrasadas", () => {
    const ui = source("app/(app)/perfil/notificacoes-section.tsx");
    expect(ui).toContain("Notificações");
    expect(ui).toContain("Ativar neste aparelho");
    expect(ui).toContain("Desativar neste aparelho");
    expect(ui).toContain("Avisar de tarefas atrasadas");
    expect(ui).toContain("No dia e um dia antes");
    expect(ui).toContain("Adicionar à Tela de Início");
    expect(ui).toContain("rounded-md");
    expect(ui).toContain("bg-white");
    const page = source("app/(app)/perfil/page.tsx");
    expect(page).toContain("NotificacoesSection");
    const sidebar = source("components/app-sidebar.tsx");
    expect(sidebar).toContain('href="/perfil"');
  });

  it("cron exige Bearer, devolve 503 sem segredo e remove 404/410", () => {
    const cron = source("app/api/cron/vencimentos/route.ts");
    expect(cron).toContain("getCronSecret");
    expect(cron).toContain("status: 503");
    expect(cron).toContain("status: 401");
    expect(cron).toContain("shouldSendAtHour");
    expect(cron).toContain("applyNotifyPrefs");
    expect(cron).toContain("visibleUserTasksWhere");
    expect(cron).toContain("isDoneColumn");
    expect(cron).toContain("isGonePushStatus");
    expect(cron).toContain("hourInTimeZone");
    expect(cron).not.toContain("BEGIN PRIVATE KEY");
  });
});
