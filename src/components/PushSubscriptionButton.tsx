"use client";

import { useState, useEffect } from "react";

interface PushSubscriptionButtonProps {
  barbershopId: string;
  vertical?: string;
}

export default function PushSubscriptionButton({ barbershopId, vertical = "BARBERIA" }: PushSubscriptionButtonProps) {
  const isGym = vertical === "GIMNASIO";
  const bgCard  = "border rounded-2xl shadow-lg backdrop-blur-xl";
  const borderC = "";
  const textPri = "text-[#f3ece1]";
  const textMut = "text-slate-400";
  const textSec = "text-slate-300";
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    // Revisar si ya tiene una suscripción activa localmente y re-sincronizar con el servidor
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setSubscribed(true);

        // Re-sincronizar silenciosamente con el servidor en cada carga
        // Esto cubre el caso de que el endpoint haya rotado o el SW se haya actualizado
        try {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              barbershopId,
              subscription: sub.toJSON(),
            }),
          });
        } catch {
          // Silencioso: si falla la re-sincronización, no afecta al usuario
        }
      }
    });
  }, [barbershopId]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeDevice = async () => {
    if (permission === "unsupported") return;
    setLoading(true);

    try {
      // Solicitar permiso de notificaciones
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        alert("Permiso para notificaciones denegado.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // Enviar la suscripción a nuestra base de datos en StackCP
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbershopId,
          subscription,
        }),
      });

      if (response.ok) {
        setSubscribed(true);
      } else {
        alert("No se pudo asociar la suscripción en el servidor.");
      }
    } catch (err) {
      console.error("Error suscribiéndose a push:", err);
      alert("Hubo un error configurando las notificaciones en este dispositivo.");
    } finally {
      setLoading(false);
    }
  };

  if (permission === "unsupported") {
    return (
      <div className={`text-xs font-mono ${textMut} border ${borderC} p-4 ${isGym ? "bg-[#0f2040]/80 rounded-2xl" : "bg-[#0a0807]"}`}>
        ⚠️ Notificaciones Push no soportadas en este navegador/dispositivo. (Usa Chrome, Safari o instala la PWA).
      </div>
    );
  }

  return (
    <div className={`${bgCard} p-6 space-y-4`} style={{ backgroundColor: "var(--theme-card, #131110)", borderColor: "var(--theme-border, #2a2520)" }}>
      <div>
        <h4 className={`font-display text-xl font-light ${textPri}`}>Alertas de Pantalla Fija</h4>
        <p className={`font-mono text-xs ${textSec} mt-1`}>
          Activa alertas nativas con sonido y vibración en esta tablet/móvil para no perder ningún Check-In.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className={`font-mono text-xs ${textMut} uppercase`}>
          Estado: {subscribed ? "🔔 Activo en este equipo" : "🔕 Desactivado"}
        </span>

        <button
          onClick={subscribeDevice}
          disabled={loading || subscribed}
          className={`px-4 py-2 font-mono text-xs tracking-wider uppercase border transition-all rounded-xl font-bold ${
            subscribed
              ? "bg-green-950/20 border-green-800 text-green-400 cursor-default"
              : "text-black"
          }`}
          style={
            subscribed
              ? undefined
              : { backgroundColor: "var(--brand-primary, var(--accent))", borderColor: "var(--brand-primary, var(--accent))" }
          }
        >
          {loading ? "CONFIGURANDO..." : subscribed ? "NOTIFICACIONES ACTIVADAS" : "ACTIVAR ALERTAS PUSH"}
        </button>
      </div>
    </div>
  );
}
