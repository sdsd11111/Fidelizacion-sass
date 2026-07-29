"use client";

import { useEffect, useState } from "react";
import PushSubscriptionButton from "@/components/PushSubscriptionButton";
import StaffManager from "@/components/panel/StaffManager";

export default function WhatsAppContent({ vertical = "BARBERIA" }: { vertical?: string }) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";

  // Theme vars
  const bgCard  = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl" : "bg-[#131110] border border-[#2a2520]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const textPri = isGym ? "text-white"      : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400"  : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300"  : "text-[#a89e90]";

  const [status, setStatus] = useState<"LOADING" | "CONNECTED" | "WAITING_QR" | "DISCONNECTED" | "ERROR">("LOADING");
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/barbershop/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setConnectedNumber(data.whatsappConnected);
        if (data.barbershopId) setBarbershopId(data.barbershopId);
        return data.status;
      } else {
        setStatus("ERROR");
      }
    } catch {
      setStatus("ERROR");
    }
    return "ERROR";
  };

  const fetchQR = async () => {
    setLoadingQR(true);
    try {
      const res = await fetch("/api/barbershop/qr");
      if (res.ok) {
        const data = await res.json();
        if (data.qrcode) {
          setQrcode(data.qrcode);
          setStatus("WAITING_QR");
        }
      }
    } catch (err) {
      console.error("Error cargando QR:", err);
    } finally {
      setLoadingQR(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const currentStatus = await fetchStatus();
      if (isMounted && currentStatus !== "CONNECTED") fetchQR();
    };
    init();
    const interval = setInterval(async () => {
      const newStatus = await fetchStatus();
      if (newStatus === "CONNECTED") setQrcode(null);
    }, 3000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const handleManualCheck = async () => {
    setChecking(true);
    await fetchStatus();
    setChecking(false);
  };

  return (
    <div className="space-y-8">
      {/* Card de estado de conexión */}
      <div className={`${bgCard} p-8 space-y-6 relative overflow-hidden`}>
        {status === "CONNECTED" && (
          <div
            className="absolute -top-24 -left-24 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)" }}
          />
        )}

        <div className={`flex justify-between items-center border-b ${borderC} pb-4`}>
          <span className={`font-mono text-xs tracking-[0.2em] uppercase ${textMut}`}>
            Estado de Conexión
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === "CONNECTED"
                  ? "bg-green-500 animate-pulse"
                  : status === "WAITING_QR"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className={`font-mono text-xs uppercase tracking-wider ${textPri}`}>
              {status === "LOADING" && "Cargando..."}
              {status === "CONNECTED" && "Conectado"}
              {status === "WAITING_QR" && "Esperando Escaneo"}
              {status === "DISCONNECTED" && "Desconectado"}
              {status === "ERROR" && "Error de Conexión"}
            </span>
          </div>
        </div>

        {status === "CONNECTED" ? (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 bg-green-950/40 border border-green-800 text-green-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h3 className={`font-display text-2xl font-light ${textPri}`}>
              ¡Tu WhatsApp está conectado!
            </h3>
            {connectedNumber && (
              <p className={`font-mono text-sm ${textSec}`}>
                Número vinculado: <span style={{ color: accent }}>+{connectedNumber}</span>
              </p>
            )}
            <p className={`font-mono text-xs ${textMut} max-w-sm mx-auto leading-relaxed`}>
              El sistema está listo y procesará los mensajes de fidelización y check-in que envíen tus clientes.
            </p>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center">
            <p className={`font-mono text-xs ${textSec} text-center max-w-md leading-relaxed`}>
              Escanea el código QR desde la aplicación de WhatsApp de tu celular (Dispositivos Vinculados) para activar el sistema de fidelidad.
            </p>

            {qrcode ? (
              <div className={`bg-white p-4 border ${borderC} relative ${isGym ? "rounded-xl" : ""}`}>
                <img src={qrcode} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className={`w-64 h-64 border ${borderC} flex flex-col items-center justify-center gap-3 ${isGym ? `${bgCard} rounded-xl` : "bg-[#0a0807]"}`}>
                <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accent} transparent transparent transparent` }} />
                <span className={`font-mono text-[10px] ${textMut} tracking-widest uppercase`}>
                  Generando QR...
                </span>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className={`font-mono text-[10px] ${textMut} uppercase tracking-wider`}>
                Si el código expira, usa el botón de abajo para recargar uno nuevo.
              </p>
            </div>
          </div>
        )}

        <div className={`flex justify-between items-center pt-4 border-t ${borderC}`}>
          {status !== "CONNECTED" ? (
            <button
              onClick={fetchQR}
              disabled={loadingQR}
              className={`px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase border transition-all disabled:opacity-50 ${isGym ? "rounded-lg" : ""}`}
              style={{ color: accent, borderColor: `${accent}66` }}
            >
              {loadingQR ? "Generando QR..." : "🔄 Recargar Código QR"}
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className={`px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase border transition-all disabled:opacity-50 ${isGym ? `${textMut} border-white/15 hover:border-white/30 rounded-lg` : "text-[#a89e90] border-[#2a2520] hover:border-[#d97644] hover:text-[#d97644]"}`}
          >
            {checking ? "Verificando..." : "Actualizar Estado"}
          </button>
        </div>
      </div>

      {/* Gestión del Equipo */}
      <StaffManager vertical={vertical} />

      {barbershopId && (
        <PushSubscriptionButton barbershopId={barbershopId} vertical={vertical} />
      )}
    </div>
  );
}
