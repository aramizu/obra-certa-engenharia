"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Label, Select, cn } from "@/components/ds";
import {
  NOTIFY_HOUR_OPTIONS,
  flagsFromNotifyWhen,
  notifyWhenFromFlags,
  type NotificationPrefs,
  type NotifyWhen,
} from "@/lib/push";

type PushStatus = {
  configured: boolean;
  vapidPublicKey: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function isIosDevice() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function supportsPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function NotifySwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border-2 border-graphite bg-white px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-md border-2 border-graphite p-0.5",
          checked ? "justify-end bg-primary" : "justify-start bg-white"
        )}
      >
        <span className="h-4 w-4 rounded-sm border-2 border-graphite bg-white" />
      </button>
    </div>
  );
}

export function NotificacoesSection({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [when, setWhen] = useState<NotifyWhen>(
    notifyWhenFromFlags(initial.notifyOnDueDay, initial.notifyDayBefore)
  );
  const [push, setPush] = useState<PushStatus | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [iosStandalone, setIosStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDevice = useCallback(async () => {
    if (!supportsPush()) {
      setPermission("unsupported");
      setEnabled(false);
      return;
    }
    setPermission(Notification.permission);
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    setEnabled(Boolean(subscription));
  }, []);

  useEffect(() => {
    setIsIos(isIosDevice());
    setIosStandalone(isStandaloneDisplay());
    void (async () => {
      try {
        const response = await fetch("/api/push/subscribe");
        if (response.ok) {
          const data = (await response.json()) as PushStatus;
          setPush(data);
        } else {
          setPush({ configured: false, vapidPublicKey: null });
        }
      } catch {
        setPush({ configured: false, vapidPublicKey: null });
      }
      await refreshDevice();
    })();
  }, [refreshDevice]);

  const savePrefs = async (next: { hour: number; when: NotifyWhen; overdue: boolean }) => {
    setError(null);
    const flags = flagsFromNotifyWhen(next.when);
    const optimistic: NotificationPrefs = {
      notifyHour: next.hour,
      notifyOnDueDay: flags.notifyOnDueDay,
      notifyDayBefore: flags.notifyDayBefore,
      notifyOverdue: next.overdue,
    };
    setPrefs(optimistic);
    setWhen(next.when);
    try {
      const response = await fetch("/api/perfil/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyHour: next.hour,
          notifyWhen: next.when,
          notifyOverdue: next.overdue,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar preferências");
    } catch (err) {
      setPrefs(prefs);
      setWhen(when);
      setError(err instanceof Error ? err.message : "Erro ao salvar preferências");
    }
  };

  const activate = async () => {
    if (!push?.configured || !push.vapidPublicKey) return;
    setBusy(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        throw new Error("Permissão de notificação não concedida");
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(push.vapidPublicKey),
      });
      const json = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao ativar notificações");
      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar notificações");
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setEnabled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar notificações");
    } finally {
      setBusy(false);
    }
  };

  const showActivate = Boolean(
    push?.configured &&
      permission !== "unsupported" &&
      permission !== "denied" &&
      !(isIos && !iosStandalone)
  );

  return (
    <section className="max-w-lg space-y-4">
      <div>
        <h2 className="text-title">Notificações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Avisos de vencimento neste aparelho, no horário escolhido (horário de Brasília).
        </p>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {isIos && !iosStandalone && (
        <Alert tone="info" title="Adicionar à Tela de Início">
          No iPhone, as notificações só funcionam depois de adicionar o app à Tela de Início:
          Compartilhar → Adicionar à Tela de Início. Abra pelo ícone na tela inicial e ative as
          notificações.
        </Alert>
      )}

      {permission === "denied" && (
        <Alert tone="warning">
          As notificações estão bloqueadas neste navegador. Toque no cadeado ao lado do endereço e
          permita notificações. No iPhone, abra Ajustes → Obra Certa Engenharia → Notificações.
        </Alert>
      )}

      {permission === "unsupported" && (
        <p className="text-sm text-muted-foreground">Este navegador não suporta notificações push.</p>
      )}

      {showActivate && (
        <Button
          type="button"
          variant={enabled ? "outline" : "default"}
          disabled={busy}
          onClick={() => void (enabled ? deactivate() : activate())}
        >
          {busy ? "Aguarde…" : enabled ? "Desativar neste aparelho" : "Ativar neste aparelho"}
        </Button>
      )}

      <div className="space-y-2">
        <Label htmlFor="notify-hour">Horário do aviso</Label>
        <Select
          id="notify-hour"
          value={String(prefs.notifyHour)}
          onChange={(event) =>
            void savePrefs({
              hour: Number(event.target.value),
              when,
              overdue: prefs.notifyOverdue,
            })
          }
        >
          {NOTIFY_HOUR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notify-when">Quando avisar</Label>
        <Select
          id="notify-when"
          value={when}
          onChange={(event) =>
            void savePrefs({
              hour: prefs.notifyHour,
              when: event.target.value as NotifyWhen,
              overdue: prefs.notifyOverdue,
            })
          }
        >
          <option value="due_day">No dia</option>
          <option value="day_before">Um dia antes</option>
          <option value="both">No dia e um dia antes</option>
        </Select>
      </div>

      <NotifySwitch
        label="Avisar de tarefas atrasadas"
        checked={prefs.notifyOverdue}
        onChange={(next) =>
          void savePrefs({
            hour: prefs.notifyHour,
            when,
            overdue: next,
          })
        }
      />
    </section>
  );
}
