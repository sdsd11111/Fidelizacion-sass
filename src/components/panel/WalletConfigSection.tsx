"use client";

import { useState, useEffect } from "react";
import DownloadQRButton from "@/components/DownloadQRButton";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  percentage: number;
}

export default function WalletConfigSection({
  whatsappNumber,
  currentBoxCode,
  shopName,
  vertical = "BARBERIA",
}: {
  whatsappNumber: string;
  currentBoxCode?: string;
  shopName?: string;
  vertical?: string;
}) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form para nuevo plan
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planPercentage, setPlanPercentage] = useState("");

  const bgCard = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl" : "bg-[#131110] border border-[#2a2520]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const textPri = isGym ? "text-white" : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300" : "text-[#a89e90]";

  // Cargar configuración existente
  useEffect(() => {
    fetch("/api/wallet/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && Array.isArray(data.plans)) {
          setPlans(data.plans);
        }
      })
      .catch((e) => console.error("Error cargando Wallet Config:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planPrice || !planPercentage) return;

    const newPlan: PlanItem = {
      id: Date.now().toString(),
      name: planName.trim(),
      price: parseFloat(planPrice),
      percentage: parseFloat(planPercentage),
    };

    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);

    setPlanName("");
    setPlanPrice("");
    setPlanPercentage("");

    savePlansToDB(updatedPlans);
  };

  const handleDeletePlan = (id: string) => {
    const updatedPlans = plans.filter((p) => p.id !== id);
    setPlans(updatedPlans);
    savePlansToDB(updatedPlans);
  };

  const savePlansToDB = async (plansToSave: PlanItem[]) => {
    setSaving(true);
    try {
      await fetch("/api/wallet/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: plansToSave }),
      });
    } catch (e) {
      console.error("Error guardando planes de Wallet:", e);
    } finally {
      setSaving(false);
    }
  };

  // QR URLs
  const qrTiendaUrl = whatsappNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `https://wa.me/${whatsappNumber}?text=Hola,%20acabo%20de%20adquirir%20un%20producto`
      )}`
    : "";

  const qrMensualidadUrl = whatsappNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `https://wa.me/${whatsappNumber}?text=Hola,%20referí%20a%20un%20nuevo%20miembro`
      )}`
    : "";

  const qrGeneralEvaluacionUrl = whatsappNumber && currentBoxCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(currentBoxCode)}`
      )}`
    : "";

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: CÓDIGOS QR VITALES DEL GIMNASIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR 1: TIENDA */}
        <div className={`${bgCard} p-6 space-y-4`}>
          <div className="space-y-1">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              🛍️ QR TIENDA
            </span>
            <h3 className={`font-display text-xl font-light ${textPri}`}>
              Compras de Tienda
            </h3>
            <p className={`font-mono text-xs ${textMut}`}>
              Pon este QR en tu tienda/recepción. El cliente escanea al comprar suplementos/accesorios.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 w-28 h-28 shrink-0 rounded-xl">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${qrTiendaUrl}')`,
                  backgroundSize: "cover",
                }}
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <DownloadQRButton qrUrl={qrTiendaUrl} barbershopName="Tienda - Gym" />
              <p className={`font-mono text-[10px] ${textMut}`}>
                Apruebas en Wallet ingresando el precio y el % asignado.
              </p>
            </div>
          </div>
        </div>

        {/* QR 2: MENSUALIDAD / REFERIDOS */}
        <div className={`${bgCard} p-6 space-y-4`}>
          <div className="space-y-1">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              💪 QR REFERIDOS
            </span>
            <h3 className={`font-display text-xl font-light ${textPri}`}>
              Mensualidad & Referidos
            </h3>
            <p className={`font-mono text-xs ${textMut}`}>
              El miembro referidor escanea este QR al traer a un nuevo socio para acumular su saldo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 w-28 h-28 shrink-0 rounded-xl">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${qrMensualidadUrl}')`,
                  backgroundSize: "cover",
                }}
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <DownloadQRButton qrUrl={qrMensualidadUrl} barbershopName="Referidos - Gym" />
              <p className={`font-mono text-[10px] ${textMut}`}>
                El sistema aplicará la comisión configurada abajo.
              </p>
            </div>
          </div>
        </div>

        {/* QR 3: EVALUACIÓN GENERAL DE ENTRENADORES */}
        <div className={`${bgCard} p-6 space-y-4`}>
          <div className="space-y-1">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-emerald-400">
              ⭐ QR GENERAL EVALUACIÓN
            </span>
            <h3 className={`font-display text-xl font-light ${textPri}`}>
              Calificar Atención / Gym
            </h3>
            <p className={`font-mono text-xs ${textMut}`}>
              Pon este QR en la entrada o zona de máquinas para recibir opiniones y valoraciones inmediatas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 w-28 h-28 shrink-0 rounded-xl">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${qrGeneralEvaluacionUrl}')`,
                  backgroundSize: "cover",
                }}
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <DownloadQRButton qrUrl={qrGeneralEvaluacionUrl} barbershopName="Evaluacion General - Gym" />
              <p className={`font-mono text-[10px] ${textMut}`}>
                Auto-aprueba e invita a calificar de 1 a 5 estrellas sin espera.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CONFIGURACIÓN DE PLANES Y PORCENTAJES DE REFERIDO */}
      <div className={`${bgCard} p-6 space-y-6`}>
        <div className={`border-b ${borderC} pb-4 flex justify-between items-center`}>
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              PLANES Y COMISIONES DE REFERIDO
            </span>
            <h3 className={`font-display text-2xl font-light ${textPri}`}>
              Configuración de Planes de Mensualidad
            </h3>
            <p className={`font-mono text-xs ${textMut} mt-1`}>
              Define el precio de cada plan y qué porcentaje en dólares ganará el referidor en su Wallet por cada cliente traído.
            </p>
          </div>
          {saving && (
            <span className="font-mono text-xs text-amber-400 animate-pulse">
              Guardando...
            </span>
          )}
        </div>

        {/* Formulario agregar plan */}
        <form onSubmit={handleAddPlan} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>Nombre del Plan</label>
            <input
              type="text"
              placeholder="Ej: Plan Básico, Elite"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className={`w-full border px-3 py-2 font-mono text-xs ${
                isGym
                  ? "bg-[#0a1628] border-white/15 text-white focus:border-blue-400 rounded-xl"
                  : "bg-[#0a0807] border-[#2a2520] text-[#f3ece1]"
              }`}
            />
          </div>

          <div>
            <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>Precio ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej: 35.00"
              value={planPrice}
              onChange={(e) => setPlanPrice(e.target.value)}
              className={`w-full border px-3 py-2 font-mono text-xs ${
                isGym
                  ? "bg-[#0a1628] border-white/15 text-white focus:border-blue-400 rounded-xl"
                  : "bg-[#0a0807] border-[#2a2520] text-[#f3ece1]"
              }`}
            />
          </div>

          <div>
            <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>% Comisión Referidor</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej: 10 (%)"
              value={planPercentage}
              onChange={(e) => setPlanPercentage(e.target.value)}
              className={`w-full border px-3 py-2 font-mono text-xs ${
                isGym
                  ? "bg-[#0a1628] border-white/15 text-white focus:border-blue-400 rounded-xl"
                  : "bg-[#0a0807] border-[#2a2520] text-[#f3ece1]"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!planName.trim() || !planPrice || !planPercentage}
            className={`w-full py-2 font-mono text-xs tracking-wider uppercase font-bold text-white transition-all disabled:opacity-50 ${
              isGym ? "rounded-xl" : ""
            }`}
            style={{ backgroundColor: accent }}
          >
            + Agregar Plan
          </button>
        </form>

        {/* Tabla de planes */}
        {loading ? (
          <p className={`font-mono text-xs ${textMut}`}>Cargando planes...</p>
        ) : plans.length === 0 ? (
          <p className={`font-mono text-xs ${textMut} italic text-center py-4`}>
            No has configurado planes aún. Agrega el primero arriba para calcular automáticamente la comisión de los referidores.
          </p>
        ) : (
          <div className={`border ${borderC} ${isGym ? "rounded-xl overflow-hidden" : ""}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${borderC} font-mono text-[10px] uppercase ${textMut} ${isGym ? "bg-white/5" : "bg-[#0a0807]"}`}>
                  <th className="p-3">Nombre Plan</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">% Comisión</th>
                  <th className="p-3">Ganancia Estimada Wallet</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderC}`}>
                {plans.map((p) => {
                  const estimatedCredit = (p.price * p.percentage) / 100;
                  return (
                    <tr key={p.id} className="font-mono text-xs">
                      <td className={`p-3 font-bold ${textPri}`}>{p.name}</td>
                      <td className={`p-3 ${textSec}`}>${p.price.toFixed(2)}</td>
                      <td className="p-3 font-bold" style={{ color: accent }}>{p.percentage}%</td>
                      <td className="p-3 text-emerald-400 font-bold">+${estimatedCredit.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="text-red-400 hover:text-red-300 transition-colors uppercase text-[10px]"
                        >
                          Eliminar ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
