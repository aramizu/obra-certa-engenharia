self.addEventListener("push", (event) => {
  let title = "Obra Certa Engenharia";
  let body = "";
  let url = "/kanban";

  try {
    const data = event.data ? event.data.json() : {};
    if (typeof data.title === "string" && data.title.trim()) title = data.title;
    if (typeof data.body === "string") body = data.body;
    if (typeof data.url === "string" && data.url.trim()) url = data.url;
  } catch {
    try {
      body = event.data ? event.data.text() : "";
    } catch {
      body = "";
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/kanban";
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === absolute && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absolute);
      }
      return undefined;
    })
  );
});
