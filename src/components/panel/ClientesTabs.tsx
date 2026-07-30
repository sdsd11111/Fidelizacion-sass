"use client";

import { useState, useEffect } from "react";

interface VisitHistoryItem {
  id: string;
  createdAt: string;
  status: string;
  rating: number | null;
  comment: string | null;
  staffName: string | null;
}

interface EnrichedCustomer {
  id: string;
  whatsapp: string;
  name: string | null;
  customerName: string | null;
  cutsCount: number;
  sessionState: string;
  lastVisitAt: Date | string | null;
  avgRating: number | null;
  isNewThisMonth: boolean;
  isRecurrent: boolean;
  totalVisits: number;
  history: VisitHistoryItem[];
}

interface ClientesTabsProps {
  customers: EnrichedCustomer[];
  initialTab: string;
  requiredCuts: number;
  loyaltyMode: string;
  vertical?: string;
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-[#5c554c] text-xs">Sin calificar</span>;
  }
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {"★".repeat(full)}
      {half ? "⯨" : ""}
      <span className="text-[#2a2520]">{"★".repeat(empty)}</span>
      <span className="text-[#5c554c] font-mono text-[10px] ml-1">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function LoyaltyBar({
  cutsCount,
  requiredCuts,
  isGym = false,
}: {
  cutsCount: number;
  requiredCuts: number;
  isGym?: boolean;
}) {
  const progress = Math.min((cutsCount % requiredCuts) / requiredCuts, 1) * 100;
  const completedCycles = Math.floor(cutsCount / requiredCuts);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-[#5c554c]">
          {cutsCount % requiredCuts}/{requiredCuts} para premio
        </span>
        {completedCycles > 0 && (
          <span className="font-mono text-[10px]" style={{ color: isGym ? "#3b82f6" : "#d97644" }}>
            🎁 {completedCycles}x completado
          </span>
        )}
      </div>
      <div className="h-1 bg-[#2a2520] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, backgroundColor: isGym ? "#3b82f6" : "#d97644" }}
        />
      </div>
    </div>
  );
}

function CustomerDetailModal({
  customer,
  requiredCuts,
  onClose,
  vertical = "BARBERIA",
}: {
  customer: EnrichedCustomer;
  requiredCuts: number;
  onClose: () => void;
  vertical?: string;
}) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";
  const modalBg = isGym ? "bg-[#0a1628] border-white/20" : "bg-[#131110] border-[#2a2520]";
  const headerBg = isGym ? "bg-[#0f2040]" : "bg-[#0a0807]";
  const textPri = isGym ? "text-white" : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300" : "text-[#a89e90]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`${modalBg} border w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-2xl relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className={`p-6 border-b ${borderC} flex items-start justify-between ${headerBg}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-display text-2xl font-light ${textPri}`}>
                {customer.name || "Perfil Sin Nombre"}
              </h3>
              {customer.isNewThisMonth && (
                <span className="px-2 py-0.5 bg-green-950/40 border border-green-800 text-green-400 font-mono text-[9px] uppercase tracking-wider rounded">
                  Nuevo
                </span>
              )}
              {customer.isRecurrent && (
                <span className="px-2 py-0.5 bg-blue-950/40 border border-blue-800 text-blue-400 font-mono text-[9px] uppercase tracking-wider rounded">
                  Recurrente
                </span>
              )}
            </div>
            <div className="flex flex-col">
              {customer.whatsapp && customer.whatsapp !== "CF" && customer.whatsapp !== "N/A" ? (
                <a
                  href={`https://wa.me/${customer.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs hover:underline"
                  style={{ color: accent }}
                >
                  <span>📱 +{customer.whatsapp}</span>
                  <span className="text-[10px] opacity-70">↗ WhatsApp</span>
                </a>
              ) : (
                <span className={`font-mono text-xs ${textMut}`}>
                  🛒 Consumidor Final (Sin WhatsApp)
                </span>
              )}
              <span className={`font-mono text-[10px] ${textMut} mt-1`}>
                Cuenta: {customer.customerName || "Sin Nombre"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`${textMut} hover:${textPri} p-1 font-mono text-lg transition-colors`}
            title="Cerrar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Resumen rápido de estadísticas */}
        <div className={`grid grid-cols-3 gap-px ${borderC} border-b text-center`}>
          <div className={`${headerBg} p-3`}>
            <p className={`font-display text-2xl font-light ${textPri}`}>
              {customer.cutsCount}
            </p>
            <p className={`font-mono text-[9px] uppercase ${textMut} tracking-wider`}>
              {isGym ? "Asistencias Totales" : "Cortes Totales"}
            </p>
          </div>
          <div className={`${headerBg} p-3`}>
            <div className="flex items-center justify-center pt-0.5">
              <StarRating rating={customer.avgRating} />
            </div>
            <p className={`font-mono text-[9px] uppercase ${textMut} tracking-wider mt-1`}>
              Promedio Stars
            </p>
          </div>
          <div className={`${headerBg} p-3`}>
            <p className={`font-display text-2xl font-light ${textPri}`}>
              {customer.totalVisits}
            </p>
            <p className={`font-mono text-[9px] uppercase ${textMut} tracking-wider`}>
              Visitas Aprobadas
            </p>
          </div>
        </div>

        {/* Barra de Fidelidad */}
        <div className={`p-4 ${headerBg}/50 border-b ${borderC}`}>
          <LoyaltyBar cutsCount={customer.cutsCount} requiredCuts={requiredCuts} isGym={isGym} />
        </div>

        {/* Contenido: Historial Cronológico de Visitas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className={`font-mono text-[10px] tracking-[0.25em] uppercase ${textMut}`}>
            Historial de Visitas ({customer.history.length})
          </p>

          {customer.history.length === 0 ? (
            <div className={`text-center py-8 border ${borderC} ${headerBg}`}>
              <p className={`font-mono text-xs ${textMut} italic`}>
                No hay visitas registradas para este cliente aún.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.history.map((v, index) => {
                const dateFormatted = new Date(v.createdAt).toLocaleDateString("es-EC", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Guayaquil",
                });

                return (
                  <div
                    key={v.id}
                    className={`${headerBg} border ${borderC} p-4 space-y-2 hover:border-blue-500/50 transition-colors rounded-xl`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span style={{ color: accent }} className="font-bold">#{customer.history.length - index}</span>
                        <span className={textSec}>{dateFormatted}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full ${
                          v.status === "APPROVED"
                            ? "bg-green-950/40 text-green-400 border border-green-800"
                            : v.status === "PENDING"
                            ? "bg-amber-950/40 text-amber-400 border border-amber-800"
                            : "bg-red-950/40 text-red-400 border border-red-800"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <div className={`flex flex-wrap items-center justify-between gap-2 pt-1 border-t ${borderC}`}>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className={textMut}>{isGym ? "🏋️ Atendido por:" : "✂️ Atendido por:"}</span>
                        <span className={`${textPri} font-medium`}>
                          {v.staffName || "Sin asignar"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-[10px] ${textMut}`}>Calificación:</span>
                        <StarRating rating={v.rating} />
                      </div>
                    </div>

                    {v.comment && (
                      <div className={`mt-2 ${modalBg} border ${borderC} p-3 rounded-xl overflow-hidden`}>
                        <p className={`font-mono text-[10px] ${textMut} uppercase tracking-wider mb-1`}>
                          💬 Comentario del cliente:
                        </p>
                        <p className={`font-sans text-xs ${textSec} italic break-all whitespace-pre-wrap`}>
                          &quot;{v.comment}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className={`p-4 border-t ${borderC} ${headerBg} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 font-mono text-xs tracking-widest uppercase text-white hover:opacity-90 transition-opacity ${isGym ? "rounded-xl" : "rounded-sm"}`}
            style={{ backgroundColor: accent }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  requiredCuts,
  onClick,
  vertical = "BARBERIA",
}: {
  customer: EnrichedCustomer;
  requiredCuts: number;
  onClick: () => void;
  vertical?: string;
}) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";
  const cardBg = isGym
    ? "bg-[#0f2040]/80 backdrop-blur-xl border-white/15 hover:border-blue-500/50 rounded-2xl"
    : "bg-[#131110] border-[#2a2520] hover:bg-[#181513]";
  const boxBg = isGym ? "bg-[#0a1628]" : "bg-[#0a0807]";
  const textPri = isGym ? "text-white" : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300" : "text-[#a89e90]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";

  const lastVisitStr = customer.lastVisitAt
    ? new Date(customer.lastVisitAt).toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Guayaquil",
      })
    : "Sin visitas";

  const daysSinceVisit = customer.lastVisitAt
    ? Math.floor(
        (Date.now() - new Date(customer.lastVisitAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      onClick={onClick}
      className={`${cardBg} border p-5 transition-all cursor-pointer group relative`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <p className={`font-display text-lg font-light ${textPri} truncate transition-colors`}>
            {customer.name || "Perfil Sin Nombre"}
          </p>
          <div className="flex flex-col mt-0.5">
            <p className={`font-mono text-xs ${textMut}`}>
              {customer.whatsapp === "CF" || customer.whatsapp === "N/A"
                ? "Consumidor Final (Sin WhatsApp)"
                : `+${customer.whatsapp}`}
            </p>
            <p className={`font-mono text-[9px] ${textMut}/70 truncate uppercase`}>
              {customer.customerName || "Cuenta sin nombre"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
          {customer.cutsCount >= 8 && (
            <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-800 text-amber-400 font-mono text-[9px] uppercase tracking-wider font-bold rounded">
              ⭐⭐⭐⭐⭐ VIP
            </span>
          )}
          {customer.isNewThisMonth && (
            <span className="px-2 py-0.5 bg-green-950/40 border border-green-800 text-green-400 font-mono text-[9px] uppercase tracking-wider rounded">
              Nuevo
            </span>
          )}
          {customer.isRecurrent && (
            <span className="px-2 py-0.5 bg-blue-950/40 border border-blue-800 text-blue-400 font-mono text-[9px] uppercase tracking-wider rounded">
              Recurrente
            </span>
          )}

          {daysSinceVisit !== null ? (
            daysSinceVisit < 30 ? (
              <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 rounded">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                🟢 Activo
              </span>
            ) : daysSinceVisit <= 60 ? (
              <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-800 text-amber-400 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 rounded">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                🟡 Hace {daysSinceVisit}d
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-950/40 border border-red-800 text-red-400 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 rounded">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                🔴 +60d sin venir
              </span>
            )
          ) : (
            <span className={`px-2 py-0.5 ${boxBg} border ${borderC} ${textMut} font-mono text-[9px] uppercase tracking-wider rounded`}>
              Sin Visita
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className={`${boxBg} p-2.5 ${isGym ? "rounded-xl" : ""}`}>
          <p className={`font-display text-2xl font-light ${textPri}`}>
            {customer.cutsCount}
          </p>
          <p className={`font-mono text-[9px] uppercase ${textMut} tracking-wider`}>
            {isGym ? "Asistencias" : "Cortes"}
          </p>
        </div>
        <div className={`${boxBg} p-2.5 ${isGym ? "rounded-xl" : ""}`}>
          <div className="flex items-center justify-center pt-1">
            <StarRating rating={customer.avgRating} />
          </div>
          <p className={`font-mono text-[9px] uppercase ${textMut} tracking-wider mt-1`}>
            Rating
          </p>
        </div>
        <div className={`${boxBg} p-2.5 ${isGym ? "rounded-xl" : ""}`}>
          <p className={`font-display text-2xl font-light ${textPri}`}>
            {customer.totalVisits}
          </p>
          <p className={`font-mono text-[9px] uppercase ${textMut} tracking-wider`}>
            Visitas
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3 font-mono text-[10px]">
        <span className={textMut}>{isGym ? "Última asistencia:" : "Último corte:"}</span>
        <span className={textSec}>
          {lastVisitStr}
          {daysSinceVisit !== null && (
            <span className={`ml-1 ${textMut}`}>
              ({daysSinceVisit === 0
                ? "hoy"
                : daysSinceVisit === 1
                ? "ayer"
                : `hace ${daysSinceVisit}d`})
            </span>
          )}
        </span>
      </div>

      <LoyaltyBar cutsCount={customer.cutsCount} requiredCuts={requiredCuts} isGym={isGym} />

      <div className={`mt-3 pt-2 border-t ${borderC} flex justify-between items-center font-mono text-[9px] ${textMut} transition-colors`}>
        <span>Ver historial completo</span>
        <span style={{ color: accent }}>🔍 Ver detalle →</span>
      </div>
    </div>
  );
}

function EmptyState({ tab, vertical = "BARBERIA" }: { tab: string; vertical?: string }) {
  const isGym = vertical === "GIMNASIO";
  const messages: Record<string, { title: string; subtitle: string }> = {
    todos: {
      title: "Aún no hay clientes registrados",
      subtitle: "Los clientes aparecerán aquí cuando hagan su primer check-in por WhatsApp.",
    },
    nuevos: {
      title: "Ningún cliente nuevo este mes",
      subtitle: "Los clientes que visiten por primera vez este mes aparecerán aquí.",
    },
    recurrentes: {
      title: "Ningún cliente recurrente todavía",
      subtitle: "Los clientes con 2 o más visitas registradas aparecerán aquí.",
    },
  };
  const msg = messages[tab] ?? messages.todos;

  const bgCard = isGym ? "bg-[#0f2040]/80 border-white/15 rounded-2xl" : "bg-[#131110] border-[#2a2520]";
  const textPri = isGym ? "text-slate-300" : "text-[#5c554c]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";

  return (
    <div className={`border ${bgCard} p-12 sm:p-16 text-center`}>
      <p className={`font-display italic text-xl ${textPri} mb-3`}>{msg.title}</p>
      <p className={`font-mono text-xs ${textMut} tracking-wider max-w-sm mx-auto leading-relaxed`}>
        {msg.subtitle}
      </p>
    </div>
  );
}

export default function ClientesTabs({
  customers,
  initialTab,
  requiredCuts,
  loyaltyMode,
  vertical = "BARBERIA",
}: ClientesTabsProps) {
  const [activeTab, setActiveTab] = useState<"todos" | "nuevos" | "recurrentes">(
    (["todos", "nuevos", "recurrentes"].includes(initialTab)
      ? initialTab
      : "todos") as "todos" | "nuevos" | "recurrentes"
  );
  const [selectedCustomer, setSelectedCustomer] = useState<EnrichedCustomer | null>(null);

  const tabs = [
    {
      id: "todos" as const,
      label: "Todos",
      count: customers.length,
    },
    {
      id: "nuevos" as const,
      label: "Nuevos este mes",
      count: customers.filter((c) => c.isNewThisMonth).length,
    },
    {
      id: "recurrentes" as const,
      label: "Recurrentes",
      count: customers.filter((c) => c.isRecurrent).length,
    },
  ];

  const filtered = customers.filter((c) => {
    if (activeTab === "nuevos") return c.isNewThisMonth;
    if (activeTab === "recurrentes") return c.isRecurrent;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-0 border border-[#2a2520] overflow-hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isGym = vertical === "GIMNASIO";
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 font-mono text-xs tracking-wider uppercase transition-colors ${
                isActive
                  ? isGym
                    ? "bg-[#3b82f6] text-[#070b14] font-bold"
                    : "bg-[#d97644] text-[#0a0807] font-bold"
                  : isGym
                    ? "bg-[#070b14] text-[#475569] hover:text-[#e2e8f0] hover:bg-[#0c1220]"
                    : "bg-[#0a0807] text-[#5c554c] hover:text-[#f3ece1] hover:bg-[#131110]"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? isGym ? "bg-[#070b14]/20 text-[#070b14]" : "bg-[#0a0807]/20 text-[#0a0807]"
                    : isGym ? "bg-[#1e293b] text-[#94a3b8]" : "bg-[#2a2520] text-[#a89e90]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ordenamiento y búsqueda */}
      {filtered.length > 0 && (
        <div className="font-mono text-[10px] text-[#5c554c]">
          Mostrando <span className="text-[#f3ece1]">{filtered.length}</span>{" "}
          {activeTab === "todos" ? "clientes" : activeTab === "nuevos" ? "clientes nuevos este mes" : "clientes recurrentes"} (haz clic en cualquiera para ver su historial)
        </div>
      )}

      {/* Grid de tarjetas */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} vertical={vertical} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              requiredCuts={requiredCuts}
              onClick={() => setSelectedCustomer(customer)}
              vertical={vertical}
            />
          ))}
        </div>
      )}

      {/* Modal Desplegable de Historial */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          requiredCuts={requiredCuts}
          onClose={() => setSelectedCustomer(null)}
          vertical={vertical}
        />
      )}
    </div>
  );
}
