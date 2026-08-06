// filepath: src/components/panel/DashboardClient.tsx
"use client";

import { useState, type ReactNode } from "react";
import { getTheme } from "@/lib/vertical-theme";
import PanelHero from "@/components/redesign/PanelHero";
import SectionTabs, { type SectionTab } from "@/components/redesign/SectionTabs";
import MetricTile from "@/components/redesign/MetricTile";
import GlassCard from "@/components/redesign/GlassCard";
import ProgressRing from "@/components/redesign/ProgressRing";
import TabsCarousel from "@/components/redesign/TabsCarousel";
import RegisterVisitButton from "@/components/RegisterVisitButton";
import ExportDataButton from "@/components/panel/ExportDataButton";
import ApprovalQueue from "@/components/ApprovalQueue";
import DirectorWidget from "@/components/panel/DirectorWidget";

export interface DashboardClientProps {
  barbershopId: string;
  barbershopName: string;
  vertical?: string;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  brandAccentColor?: string | null;
  isPremium: boolean;
  healthScore: number;
  healthStatus: string;
  healthDot: string;
  healthMessage: string;
  avgRating: number;
  totalRatings: number;
  ratingsThisMonth: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  retentionRate: number;
  recurrentCustomers: number;
  overdueCustomers: Array<{
    id: string;
    name: string | null;
    whatsapp: string;
    cutsCount: number;
    metrics: { status: string; daysSinceLastVisit: number; avgIntervalDays: number };
  }>;
  preCutCustomers: Array<{
    id: string;
    name: string | null;
    whatsapp: string;
    cutsCount: number;
    metrics: { status: string; daysSinceLastVisit: number; avgIntervalDays: number };
  }>;
  vipCustomers: Array<{
    id: string;
    name: string | null;
    whatsapp: string;
    cutsCount: number;
  }>;
  recentVisits: Array<{
    id: string;
    customerName: string;
    customerWhatsapp: string;
    cutsCount: number;
    status: string;
    rating: number | null;
    createdAt: string | Date;
  }>;
  /** Widget premium server-rendered (Motor de Conocimiento). */
  motorWidget?: ReactNode;
}

type TabId = "reputacion" | "clientes" | "retencion" | "recupera";

const HERO_IMAGES_BARBERIA: Record<TabId, { url: string; position: string }> = {
  reputacion: {
    url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80",
    position: "center",
  },
  clientes: {
    url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80",
    position: "center",
  },
  retencion: {
    url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&q=80",
    position: "center 30%",
  },
  recupera: {
    url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1600&q=80",
    position: "center",
  },
};

const HERO_IMAGES_GIMNASIO: Record<TabId, { url: string; position: string }> = {
  reputacion: {
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80",
    position: "center",
  },
  clientes: {
    url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80",
    position: "center",
  },
  retencion: {
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80",
    position: "center 30%",
  },
  recupera: {
    url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1600&q=80",
    position: "center",
  },
};

export default function DashboardClient({
  barbershopId,
  barbershopName,
  vertical = "BARBERIA",
  brandPrimaryColor,
  brandSecondaryColor,
  brandAccentColor,
  isPremium,
  healthScore,
  healthStatus,
  healthDot,
  healthMessage,
  avgRating,
  totalRatings,
  ratingsThisMonth,
  totalCustomers,
  newCustomersThisMonth,
  retentionRate,
  recurrentCustomers,
  overdueCustomers,
  preCutCustomers,
  vipCustomers,
  recentVisits,
  motorWidget,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("reputacion");
  const theme = getTheme(vertical, {
    brandPrimaryColor,
    brandSecondaryColor,
    brandAccentColor,
  });
  const { colors, texts } = theme;

  const customersToRecover = [...overdueCustomers, ...preCutCustomers];

  const tabs: SectionTab[] = [
    { id: "reputacion", label: "Reputación", icon: "★", badge: avgRating.toFixed(1) },
    { id: "clientes", label: "Clientes", icon: "◐", badge: totalCustomers },
    { id: "retencion", label: "Retención", icon: "↻", badge: `${retentionRate}%` },
    { id: "recupera", label: "Recupera", icon: "⚠", badge: customersToRecover.length },
  ];

  const heroImagesMap = vertical === "GIMNASIO" ? HERO_IMAGES_GIMNASIO : HERO_IMAGES_BARBERIA;
  const heroImage = heroImagesMap[activeTab];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* HERO PRINCIPAL CON TABS DENTRO */}
      <PanelHero
        imageUrl={heroImage.url}
        imagePosition={heroImage.position}
        accentColor={colors.accent}
        minHeight={360}
        vertical={vertical}
        eyebrow="Espejo del Negocio"
        badge={
          isPremium && (
            <span 
              className="px-2 py-0.5 text-[9px] font-mono rounded-full uppercase tracking-[0.2em] border"
              style={{
                backgroundColor: `${colors.accent}20`,
                color: colors.accent,
                borderColor: `${colors.accent}40`,
              }}
            >
              Plan Premium
            </span>
          )
        }
        title={barbershopName}
        subtitle={healthMessage}
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div
              style={{
                backgroundColor: "var(--theme-card, #131110)",
                borderColor: "var(--theme-border, rgba(255,255,255,0.15))",
              }}
              className="flex items-center gap-4 backdrop-blur-md rounded-2xl px-5 py-4 border shadow-lg"
            >
              <ProgressRing
                value={healthScore}
                label={String(healthScore)}
                suffix="/100"
                size={112}
                stroke={9}
                vertical={vertical}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-display text-xl text-zinc-100">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${healthDot}`} />
                  <span className="truncate">{healthStatus}</span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mt-1">
                  Salud del Negocio
                </p>
              </div>
            </div>
            <RegisterVisitButton barbershopId={barbershopId} vertical={vertical} />
          </div>
        }
        overlay={
          <TabsCarousel vertical={vertical}>
            <SectionTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
              variant="pill"
              vertical={vertical}
            />
          </TabsCarousel>
        }
      />

      {/* CONTENIDO DE LA TAB ACTIVA */}
      {activeTab === "reputacion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Calificación"
              value={avgRating.toFixed(1)}
              caption={`${totalRatings} reseñas registradas`}
              icon="★"
              accent="amber"
              vertical={vertical}
              footer={
                <>
                  <span>↑</span>
                  <span>+{ratingsThisMonth} este mes</span>
                </>
              }
            />
            <MetricTile
              label="Reseñas"
              value={totalRatings}
              caption="Votos recibidos de clientes"
              icon="✎"
              accent="amber"
              vertical={vertical}
            />
            <MetricTile
              label="Tendencia"
              value={ratingsThisMonth > 0 ? `+${ratingsThisMonth}` : "—"}
              caption="Reseñas nuevas este mes"
              icon="↗"
              accent={ratingsThisMonth > 0 ? "green" : "neutral"}
              vertical={vertical}
            />
          </div>

          <GlassCard padding="lg" vertical={vertical}>
            <h3 className="font-display text-2xl font-light text-zinc-100 mb-2">
              Tu reputación, en tiempo real
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Cada visita aprobada pide una reseña al cliente. Si sale contento, se publica a
              Google en el momento. Si no, te avisamos antes de que pase algo. Tu score se
              construye automáticamente sin que tengas que hacer nada.
            </p>
          </GlassCard>
        </div>
      )}

      {activeTab === "clientes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Base Activa"
              value={totalCustomers}
              caption="Clientes en tu base"
              icon="◐"
              accent="orange"
              vertical={vertical}
              href="/panel/clientes?tab=todos"
              footer={
                <>
                  <span>+</span>
                  <span>{newCustomersThisMonth} nuevos este mes</span>
                </>
              }
            />
            <MetricTile
              label="Nuevos del Mes"
              value={newCustomersThisMonth}
              caption={vertical === "GIMNASIO" ? "Primera asistencia este mes" : "Primer corte este mes"}
              icon="✦"
              accent="green"
              vertical={vertical}
            />
            <MetricTile
              label="Recurrentes"
              value={recurrentCustomers}
              caption={vertical === "GIMNASIO" ? "2+ asistencias registradas" : "2+ cortes registrados"}
              icon="↻"
              accent="neutral"
              vertical={vertical}
              href="/panel/clientes?tab=recurrentes"
            />
          </div>

          {/* VIPs */}
          <GlassCard padding="lg" vertical={vertical}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-light text-[#f3ece1] flex items-center gap-2">
                <span>⭐</span> Tus Mejores Clientes (VIPs)
              </h3>
              <span className="font-mono text-[10px] text-[#5c554c] uppercase tracking-wider">
                Top 5
              </span>
            </div>
            {vipCustomers.length === 0 ? (
              <p className="font-mono text-xs text-[#5c554c] italic">
                Aún no hay suficientes registros.
              </p>
            ) : (
              <div className="space-y-2">
                {vipCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className={`flex justify-between items-center p-3 border transition-colors rounded-xl ${vertical === "GIMNASIO" ? "bg-[#070b14]/60 border-[#1a2540] hover:border-[#1e293b]" : "bg-[#0a0807]/60 border-[#2a2520] hover:border-[#3a2f25]"}`}
                  >
                    <div>
                      <p className="font-display text-sm text-[#f3ece1] font-light flex items-center gap-2">
                        {cust.name || "Cliente Registrado"}
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40 uppercase tracking-wider">
                          VIP
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-[#5c554c] mt-0.5">
                        {cust.cutsCount} {vertical === "GIMNASIO" ? "asistencias realizadas" : "visitas realizadas"}
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${cust.whatsapp}?text=${encodeURIComponent(
                        `¡Hola ${cust.name || ""}! Gracias por ser uno de nuestros miembros VIP en ${barbershopName}. Te esperamos pronto.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800 px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === "retencion" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Tasa de Retención"
              value={`${retentionRate}%`}
              caption="Clientes que regresan"
              icon="↻"
              accent={retentionRate >= 50 ? "green" : "amber"}
              vertical={vertical}
              footer={
                <>
                  <span>●</span>
                  <span>{recurrentCustomers} recurrentes</span>
                </>
              }
            />
            <MetricTile
              label="Total Recurrentes"
              value={recurrentCustomers}
              caption={vertical === "GIMNASIO" ? "2+ asistencias registradas" : "2+ cortes registrados"}
              icon="✓"
              accent="green"
              vertical={vertical}
            />
            <MetricTile
              label="En Riesgo"
              value={overdueCustomers.length}
              caption="Excedieron 1.2x su patrón"
              icon="!"
              accent={overdueCustomers.length > 0 ? "amber" : "neutral"}
              vertical={vertical}
              href="/panel/clientes?tab=recurrentes"
            />
          </div>

          <GlassCard padding="lg" vertical={vertical}>
            <h3 className="font-display text-xl font-light text-[#f3ece1] mb-2">
              Fidelización que se mide sola
            </h3>
            <p className="text-sm text-[#a89e90] leading-relaxed">
              {vertical === "GIMNASIO"
                ? "Cada miembro tiene su propio patrón de asistencia. GymOS aprende cuándo es el momento justo para recordarles su rutina y nunca pierde una oportunidad de traerlos de vuelta. La retención se construye con avisos precisos, no spam."
                : "Cada cliente tiene su propio patrón de corte. BarberOS aprende cuándo es el momento justo para recordarles y nunca pierde una oportunidad de traerlos de vuelta. La retención se construye con avisos precisos, no spam."}
            </p>
          </GlassCard>
        </div>
      )}

      {activeTab === "recupera" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="A Recuperar"
              value={customersToRecover.length}
              caption="Total fuera de patrón"
              icon="⚠"
              accent={customersToRecover.length > 0 ? "amber" : "neutral"}
              vertical={vertical}
            />
            <MetricTile
              label="1.2x Excedido"
              value={overdueCustomers.length}
              caption="Superaron su ciclo"
              icon="↘"
              accent="orange"
              vertical={vertical}
            />
            <MetricTile
              label={vertical === "GIMNASIO" ? "0.8x Pre-asistencia" : "0.8x Pre-corte"}
              value={preCutCustomers.length}
              caption="Pronto a salir"
              icon="⏰"
              accent="amber"
              vertical={vertical}
            />
          </div>

          <GlassCard padding="lg" vertical={vertical}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-light text-[#f3ece1] flex items-center gap-2">
                  <span className="text-amber-400">🚨</span> Clientes que te extrañan
                </h3>
                <p className="font-mono text-[9px] text-[#5c554c] uppercase tracking-widest mt-1">
                  Frecuencia Inteligente (0.8x / 1.2x)
                </p>
              </div>
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider">
                PWA 8:00 AM
              </span>
            </div>

            {customersToRecover.length === 0 ? (
              <p className="font-mono text-xs text-emerald-400 italic">
                {vertical === "GIMNASIO"
                  ? "¡Excelente! Todos tus miembros están dentro de su ciclo habitual de asistencia."
                  : "¡Excelente! Todos tus clientes están dentro de su ciclo habitual de corte."}
              </p>
            ) : (
              <div className="space-y-2">
                {customersToRecover.slice(0, 6).map((cust) => {
                  const isOverdue = cust.metrics.status === "OVERDUE";
                  const days = cust.metrics.daysSinceLastVisit || 0;
                  const pattern = cust.metrics.avgIntervalDays;

                  const unit = vertical === "GIMNASIO" ? "asistencia" : "corte";
                  const actionWord = vertical === "GIMNASIO" ? "mantener tu rutina fitness" : "renovar tu estilo";

                  const msgText = isOverdue
                    ? `¡Hola ${cust.name || ""}! Te extrañamos en ${barbershopName}. Tu tiempo habitual de ${unit} es cada ${pattern} días y han pasado ${days} días. ¡Te esperamos para ${actionWord}!`
                    : `¡Hola ${cust.name || ""}! En ${barbershopName} recordamos que ya casi se cumple tu ciclo habitual de ${unit} (hace ${days} días). ¿Te agendamos un espacio?`;

                  return (
                    <div
                      key={cust.id}
                      className={`flex justify-between items-center p-3 border transition-colors rounded-xl ${vertical === "GIMNASIO" ? "bg-[#070b14]/60 border-[#1a2540] hover:border-[#1e293b]" : "bg-[#0a0807]/60 border-[#2a2520] hover:border-[#3a2f25]"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-sm text-[#f3ece1] font-light">
                            {cust.name || "Cliente Registrado"}
                          </p>
                          <span
                            className={[
                              "text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider",
                              isOverdue
                                ? "bg-red-950/40 text-red-400 border-red-800"
                                : "bg-amber-950/40 text-amber-400 border-amber-800",
                            ].join(" ")}
                          >
                            {isOverdue ? "1.2x Excedido" : (vertical === "GIMNASIO" ? "0.8x Pre-asistencia" : "0.8x Pre-corte")}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-[#5c554c] mt-0.5">
                          ⚠️ Hace {days}d (Patrón habitual: c/{pattern}d)
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/${cust.whatsapp}?text=${encodeURIComponent(msgText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={[
                          "font-mono text-[10px] px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shrink-0 uppercase tracking-wider",
                          isOverdue
                            ? "text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800"
                            : "text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800",
                        ].join(" ")}
                      >
                        {isOverdue ? "📩 Invitar" : "⏰ Avisar"}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* COLA DE APROBACIONES (siempre visible) */}
      <ApprovalQueue barbershopId={barbershopId} />

      {/* DIRECTOR IA — EXCLUSIVO PARA PREMIUM */}
      {isPremium && <DirectorWidget />}

      {/* LIBRO DIARIO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-display text-xl sm:text-2xl font-light text-zinc-100">
            Libro Diario{" "}
            <span className="text-zinc-500 text-sm font-mono">/ Historial de Hoy</span>
          </h3>
          {isPremium && <ExportDataButton variant="compact" />}
        </div>

        {recentVisits.length === 0 ? (
          <GlassCard padding="lg" vertical={vertical}>
            <p className="font-display italic text-lg text-zinc-400 mb-2 text-center">
              No hay visitas registradas el día de hoy
            </p>
            <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase text-center">
              Usa el botón {vertical === "GIMNASIO" ? '"Registrar Asistencia"' : '"Registrar Corte"'} arriba para añadir un registro manual.
            </p>
          </GlassCard>
        ) : (
          <GlassCard padding="sm" className="overflow-x-auto" vertical={vertical}>
            <table className="w-full text-left font-mono text-xs text-zinc-400">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 uppercase">
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">WhatsApp</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Calificación</th>
                  <th className="py-3 px-3 text-right">Hora</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-3 font-display text-base text-zinc-100 font-light">
                      {visit.customerName}
                    </td>
                    <td className="py-3 px-3">+{visit.customerWhatsapp}</td>
                    <td className="py-3 px-3">
                      <span
                        className={[
                          "px-2 py-0.5 rounded-full text-[10px]",
                          visit.status === "APPROVED"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800"
                            : visit.status === "PENDING"
                              ? "bg-amber-950/40 text-amber-400 border border-amber-800 animate-pulse"
                              : "bg-red-950/40 text-red-400 border border-red-800",
                        ].join(" ")}
                      >
                        {visit.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-400">
                      {visit.rating
                        ? "★".repeat(visit.rating) + "☆".repeat(5 - visit.rating)
                        : "Sin calificar"}
                    </td>
                    <td className="py-3 px-3 text-right text-[#5c554c]" suppressHydrationWarning>
                      {(() => {
                        const d = new Date(visit.createdAt);
                        const hh = String(d.getUTCHours() - 5).padStart(2, "0"); // EC = UTC-5
                        const mm = String(d.getUTCMinutes()).padStart(2, "0");
                        return `${hh}:${mm}`;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>

      {/* MOTOR DE CONOCIMIENTO (PREMIUM) — al final como referencia histórica */}
      {motorWidget}
    </div>
  );
}