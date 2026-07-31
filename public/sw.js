self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body || "Tienes una solicitud pendiente de aprobación.",
        icon: "/logos/gymos_isotipo_192.png",
        badge: "/logos/gymos_isotipo_192.png",
        vibrate: [200, 100, 200],
        data: {
          url: payload.url || "/panel",
        },
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || "💪 GymOS Notification", options)
      );
    } catch (e) {
      // Fallback si no es JSON válido
      const options = {
        body: event.data.text(),
        icon: "/logos/gymos_isotipo_192.png",
        badge: "/logos/gymos_isotipo_192.png",
        vibrate: [200, 100, 200],
        data: {
          url: "/panel",
        },
      };
      event.waitUntil(
        self.registration.showNotification("💪 GymOS Notification", options)
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/panel";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Si la app está abierta, redirigimos/enfocamos
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Si no, la abrimos de nuevo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
