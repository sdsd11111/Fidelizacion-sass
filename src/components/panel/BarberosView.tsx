"use client";

import { useState } from "react";
import DownloadQRButton from "@/components/DownloadQRButton";

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customerName: string;
  customerWhatsapp: string;
}

interface StaffStat {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
  avgRating: number;
  totalRatings: number;
  distribution: number[]; // [1★, 2★, 3★, 4★, 5★]
  reviews: ReviewItem[];
}

interface BarberosViewProps {
  generalAvg: number;
  generalCount: number;
  generalDistribution: number[];
  staffStats: StaffStat[];
  unassignedCount: number;
  whatsappNumber: string;
  currentBoxCode: string;
  vertical?: string;
}

function buildStaffQrUrl(whatsappNumber: string, boxCode: string, staffName: string) {
  const message = `Hola, mi código de caja es ${boxCode}. Me atendió ${staffName}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  )}`;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 tracking-wider">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

function RatingBar({
  stars,
  count,
  total,
  isGym = false,
}: {
  stars: number;
  count: number;
  total: number;
  isGym?: boolean;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`${isGym ? "text-slate-500" : "text-[#5c554c]"} w-4 text-right`}>{stars}</span>
      <span className="text-amber-400">★</span>
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isGym ? "bg-white/10" : "bg-[#1c1917]"}`}>
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`${isGym ? "text-slate-500" : "text-[#5c554c]"} w-8 text-right`}>{count}</span>
    </div>
  );
}

function StaffCard({
  staff,
  isSelected,
  onClick,
  qrUrl,
  isGym = false,
  accent = "#d97644",
}: {
  staff: StaffStat;
  isSelected: boolean;
  onClick: () => void;
  qrUrl: string;
  isGym?: boolean;
  accent?: string;
}) {
  const baseCard = isGym
    ? `bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/40`
    : `bg-[#0a0807] border border-[#2a2520] hover:border-[#3a3530]`;

  const selectedCard = isGym
    ? `bg-white/15 backdrop-blur-lg border`
    : `bg-[#131110] border`;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 sm:p-5 transition-all duration-200 ${
        isSelected ? selectedCard : baseCard
      }`}
      style={isSelected ? { borderColor: accent } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Foto rectangular */}
        <div className={`w-16 h-20 shrink-0 overflow-hidden relative border ${isGym ? "bg-white/10 border-white/20" : "bg-[#131110] border-[#2a2520]"}`}>
          {staff.photoUrl ? (
            <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-xl ${isGym ? "bg-white/5" : "bg-[#131110]"}`}>
              {isGym ? "🏋️" : "💈"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-display text-lg font-light truncate ${isGym ? "text-[#e2e8f0]" : "text-[#f3ece1]"}`}>
              {staff.name}
            </h4>
            {staff.totalRatings > 0 && (
              <span className="font-display text-2xl font-light ml-2" style={{ color: accent }}>
                {staff.avgRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-mono text-[10px] uppercase tracking-wider ${isGym ? "text-slate-500" : "text-[#5c554c]"}`}>
              {staff.role === "OWNER" ? "Dueño" : (isGym ? "Entrenador" : "Barbero")}
            </span>
            {staff.totalRatings > 0 ? (
              <div className="flex items-center gap-1.5">
                <StarDisplay rating={staff.avgRating} />
                <span className={`font-mono text-[10px] ${isGym ? "text-slate-500" : "text-[#5c554c]"}`}>
                  ({staff.totalRatings})
                </span>
              </div>
            ) : (
              <span className={`font-mono text-[10px] italic ${isGym ? "text-slate-500" : "text-[#5c554c]"}`}>
                Sin calificaciones
              </span>
            )}
          </div>
        </div>

        {/* QR mini — solo para barberías (en gimnasio solo hay 1 QR general) */}
        {!isGym && (
          <div className="shrink-0 bg-white p-1 w-12 h-12 sm:w-14 sm:h-14">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url('${qrUrl}')`,
                backgroundSize: "cover",
              }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

export default function BarberosView({
  generalAvg,
  generalCount,
  generalDistribution,
  staffStats,
  unassignedCount,
  whatsappNumber,
  currentBoxCode,
  vertical = "BARBERIA",
}: BarberosViewProps) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";
  const accentLight = isGym ? "#60a5fa" : "#e89263";

  // ── Theme variables ──────────────────────────────────────────
  const bgCard  = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl"   : "bg-[#131110] border border-[#2a2520]";
  const bgDark  = isGym ? "bg-[#0a1628]"   : "bg-[#0a0807]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const divideC = isGym ? "divide-white/10" : "divide-[#1c1917]";
  const textPri = isGym ? "text-white"      : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400"  : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300"  : "text-[#a89e90]";
  const rounded = isGym ? "rounded-2xl"     : "";
  // ─────────────────────────────────────────────────────────────

  const [selectedView, setSelectedView] = useState<"general" | string>("general");
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(10);

  const selectedStaff = selectedView !== "general"
    ? staffStats.find((s) => s.id === selectedView)
    : null;

  const currentAvg = selectedStaff ? selectedStaff.avgRating : generalAvg;
  const currentCount = selectedStaff ? selectedStaff.totalRatings : generalCount;
  const currentDistribution = selectedStaff ? selectedStaff.distribution : generalDistribution;

  const handleSelectTab = (view: string) => {
    setSelectedView(view);
    setVisibleReviewsCount(10);
  };

  const reviewsList = selectedStaff ? selectedStaff.reviews : [];
  const visibleReviews = reviewsList.slice(0, visibleReviewsCount);

  // QR General de Calificación
  const generalQrMsg = isGym
    ? `Hola, quiero calificar el servicio mi codigo es ${currentBoxCode}`
    : `Hola, mi código de caja es ${currentBoxCode}`;

  const generalQrUrl = whatsappNumber
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(generalQrMsg)}`
      )}`
    : "";

  // Ordenar staff para Ranking
  const rankedStaff = [...staffStats].sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.totalRatings - a.totalRatings;
  });

  return (
    <div className="space-y-6">
      {/* QR General del Negocio (Solo para Barberías, oculto en Gimnasios) */}
      {!isGym && selectedView === "general" && whatsappNumber && (
      <div className={`${bgCard} p-6 flex flex-col sm:flex-row items-center justify-between gap-6`}>
          <div className="space-y-2 text-center sm:text-left">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
              QR PRINCIPAL DE CAJA
            </span>
            <h3 className={`font-display text-2xl font-light ${textPri}`}>
              QR General para Clientes
            </h3>
            <p className={`font-mono text-xs ${textMut} max-w-md`}>
              Escanea para registrar {isGym ? "asistencia" : "corte"} con el código de caja en vivo:{" "}
              <strong className="font-normal" style={{ color: accent }}>{currentBoxCode}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {/* QR siempre sobre fondo blanco */}
            <div className="bg-white p-2 w-28 h-28 sm:w-32 sm:h-32">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('${generalQrUrl}')`,
                  backgroundSize: "cover",
                }}
              />
            </div>
            <DownloadQRButton
              qrUrl={generalQrUrl}
              barbershopName={isGym ? "Gimnasio General" : "Barbería General"}
              vertical={vertical === "GIMNASIO" ? "GIMNASIO" : "BARBERIA"}
            />
          </div>
        </div>
      )}

      {/* Tabs superiores */}
      <div className="flex gap-2 overflow-x-auto pb-1 items-center">
        <button
          onClick={() => handleSelectTab("general")}
          className={`px-5 py-2 font-mono text-xs tracking-[0.2em] uppercase whitespace-nowrap border transition-colors ${
            selectedView === "general"
              ? `font-bold`
              : isGym
              ? "bg-transparent text-slate-500 border-white/20 hover:text-[#e2e8f0] hover:border-white/40"
              : "bg-transparent text-[#5c554c] border-[#2a2520] hover:text-[#a89e90] hover:border-[#3a3530]"
          }`}
          style={{
            backgroundColor: selectedView === "general" ? accent : "transparent",
            borderColor: selectedView === "general" ? accent : undefined,
            color: selectedView === "general" ? "#fff" : undefined,
          }}
        >
          TODOS
        </button>
        {staffStats.map((staff) => (
          <button
            key={staff.id}
            onClick={() => handleSelectTab(staff.id)}
            className={`px-5 py-2 font-mono text-xs tracking-[0.2em] uppercase whitespace-nowrap border transition-colors ${
              selectedView === staff.id
                ? `font-bold shadow-sm`
                : isGym
                ? "bg-transparent text-slate-500 border-white/20 hover:text-[#e2e8f0] hover:border-white/40"
                : "bg-[#0a0807] text-[#5c554c] border-[#2a2520] hover:text-[#a89e90] hover:border-[#3a3530]"
            }`}
            style={{
              backgroundColor: selectedView === staff.id ? accent : isGym ? "transparent" : "#0a0807",
              borderColor: selectedView === staff.id ? accent : isGym ? "rgba(255,255,255,0.2)" : "#2a2520",
              color: selectedView === staff.id ? "#fff" : undefined,
            }}
          >
            {staff.name}
          </button>
        ))}
      </div>

      {/* 🏆 RANKING DEL MES */}
      {selectedView === "general" && rankedStaff.length > 0 && (
        <div className={`${bgCard} p-6 space-y-4`}>
          <div className={`flex items-center justify-between border-b ${borderC} pb-3`}>
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: accent }}>
                COMPETENCIA SANA
              </span>
              <h3 className={`font-display text-xl font-light ${textPri}`}>
                🏆 Ranking del Mes
              </h3>
            </div>
            <span className={`font-mono text-[10px] ${textMut} uppercase`}>Por Calificación</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rankedStaff.slice(0, 3).map((staff, idx) => {
              const medals = ["🥇 1º Lugar", "🥈 2º Lugar", "🥉 3º Lugar"];
              const borderColors = [
                "border-amber-500/60 bg-amber-950/20",
                "border-slate-400/60 bg-slate-900/20",
                "border-amber-700/60 bg-amber-950/10",
              ];
              const gymBorderColors = [
                "border-amber-500/60 bg-white/10",
                "border-slate-400/60 bg-white/5",
                "border-amber-700/60 bg-white/5",
              ];

              return (
                <div
                  key={staff.id}
                  onClick={() => handleSelectTab(staff.id)}
                  className={`p-4 border ${isGym ? gymBorderColors[idx] : borderColors[idx]} space-y-2 cursor-pointer hover:opacity-90 transition-opacity ${isGym ? "rounded-xl" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-xs font-bold ${textPri}`}>
                      {medals[idx]}
                    </span>
                    <span className="font-display text-xl font-light text-amber-400">
                      {staff.avgRating.toFixed(1)} ★
                    </span>
                  </div>
                  <p className={`font-display text-lg font-light ${textPri} truncate`}>
                    {staff.name}
                  </p>
                  <p className={`font-mono text-[10px] ${textMut}`}>
                    {staff.totalRatings} reseñas recibidas
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner Principal del Entrenador/Barbero seleccionado */}
      {selectedStaff && (
        <div className={`${bgCard} relative overflow-hidden flex flex-col md:flex-row items-stretch`}>
          {/* Izquierdo: Info del Entrenador/Barbero (y QR solo en Barberías) */}
          <div className="p-5 sm:p-8 flex-1 flex flex-col justify-between space-y-4 md:space-y-6 z-10">
            <div className="flex flex-row items-start justify-between md:justify-start gap-4 sm:gap-6">
              {/* QR + Botón Descargar (SOLO BARBERÍA) */}
              {!isGym && whatsappNumber && (
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <p className={`font-mono text-[9px] sm:text-[10px] tracking-[0.25em] uppercase ${textMut}`}>
                    QR DE {selectedStaff.name.toUpperCase()}
                  </p>
                  {(() => {
                    const qrUrl = buildStaffQrUrl(whatsappNumber, currentBoxCode, selectedStaff.name);
                    return (
                      <>
                        <div className="bg-white p-2 sm:p-3 w-28 h-28 sm:w-36 sm:h-36">
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url('${qrUrl}')`,
                              backgroundSize: "cover",
                            }}
                          />
                        </div>
                        <DownloadQRButton
                          qrUrl={qrUrl}
                          barbershopName={selectedStaff.name}
                          vertical={vertical === "GIMNASIO" ? "GIMNASIO" : "BARBERIA"}
                        />
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Foto en móvil */}
              <div className={`md:hidden w-28 h-36 sm:w-32 sm:h-44 shrink-0 border ${borderC} ${bgDark} overflow-hidden relative shadow-md`}>
                {selectedStaff.photoUrl ? (
                  <img
                    src={selectedStaff.photoUrl}
                    alt={selectedStaff.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                    <span className="text-3xl opacity-40 mb-1">{isGym ? "🏋️" : "💈"}</span>
                    <span className={`font-mono text-[9px] ${textMut}`}>Sin Foto</span>
                  </div>
                )}
              </div>
            </div>

            {/* Texto explicativo / Perfil del profesional */}
            <div className="space-y-2 pt-2 md:pt-0">
              <span className={`font-mono text-[10px] uppercase tracking-widest ${isGym ? "text-blue-400" : "text-amber-500"}`}>
                {isGym ? "Perfil del Entrenador" : "Perfil del Barbero"}
              </span>
              <h3 className={`font-display text-2xl sm:text-3xl font-light ${textPri}`}>
                {selectedStaff.name}
              </h3>
              <p className={`font-mono text-xs ${textMut} leading-relaxed max-w-xl`}>
                {isGym ? (
                  <>
                    Los miembros escanean el <strong className="font-normal" style={{ color: accent }}>QR General del Gimnasio</strong> y seleccionan a <span className={textSec}>{selectedStaff.name}</span> al responder por WhatsApp.
                  </>
                ) : (
                  <>
                    El cliente escanea su QR exclusivo y el sistema{" "}
                    <strong className="font-normal" style={{ color: accent }}>automáticamente sabe</strong>{" "}
                    que fue atendido por <span className={textSec}>{selectedStaff.name}</span>.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Derecho: Foto en escritorio */}
          <div className={`hidden md:flex w-80 lg:w-96 shrink-0 relative min-h-full overflow-hidden items-center justify-center ${bgDark}`}>
            {selectedStaff.photoUrl ? (
              <>
                <img
                  src={selectedStaff.photoUrl}
                  alt={selectedStaff.name}
                  className="w-full h-full object-cover object-center"
                />
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    background: isGym
                      ? "linear-gradient(to right, rgba(15,32,64,0.9), transparent)"
                      : "linear-gradient(to right, rgba(19,17,16,0.9), transparent)",
                  }}
                />
              </>
            ) : (
              <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${bgDark} border-l ${borderC}`}>
                <span className="text-5xl opacity-40 mb-2">{isGym ? "🏋️" : "💈"}</span>
                <p className={`font-mono text-xs ${textMut}`}>Sin foto configurada</p>
                <a
                  href="/panel/whatsapp"
                  className={`font-mono text-[10px] uppercase tracking-wider mt-2 hover:underline`}
                  style={{ color: accent }}
                >
                  Configurar Foto ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel de calificación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score grande */}
        <div className={`${bgCard} p-6 sm:p-8 flex flex-col items-center justify-center rounded-2xl`}>
          <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textMut} mb-3`}>
            {selectedStaff ? selectedStaff.name : "Calificación General"}
          </p>
          {currentCount > 0 ? (
            <>
              <p className="font-display text-7xl sm:text-8xl font-light" style={{ color: accent }}>
                {currentAvg.toFixed(1)}
              </p>
              <div className="mt-2">
                <StarDisplay rating={currentAvg} />
              </div>
              <p className={`font-mono text-[10px] ${textMut} mt-2`}>
                {currentCount} calificaciones
              </p>
            </>
          ) : (
            <p className={`font-mono text-sm ${textMut} italic text-center`}>
              Sin calificaciones aún
            </p>
          )}
        </div>

        {/* Distribución de estrellas */}
        <div className={`${bgCard} p-6 sm:col-span-2 flex flex-col justify-center gap-2`}>
          <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textMut} mb-2`}>
            Distribución
          </p>
          {[5, 4, 3, 2, 1].map((stars) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={currentDistribution[stars - 1]}
              total={currentCount}
              isGym={isGym}
            />
          ))}
        </div>
      </div>

      {/* Lista de reseñas */}
      {selectedStaff && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textMut}`}>
              Calificaciones de {selectedStaff.name} ({reviewsList.length})
            </p>
          </div>

          {reviewsList.length === 0 ? (
            <div className={`${bgCard} p-8 text-center`}>
              <p className={`font-display italic ${textMut}`}>
                Este profesional aún no tiene calificaciones registradas.
              </p>
            </div>
          ) : (
            <>
              <div className={`border ${borderC} ${isGym ? "bg-[#0a1628]/60 backdrop-blur rounded-2xl overflow-hidden" : "bg-[#131110]"} divide-y ${divideC}`}>
                {visibleReviews.map((rev) => (
                  <div key={rev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-display text-base ${textPri} font-light`}>
                          {rev.customerName}
                        </p>
                        {rev.customerWhatsapp && (
                          <span className={`font-mono text-[10px] ${textMut}`}>
                            (+{rev.customerWhatsapp})
                          </span>
                        )}
                      </div>
                      {rev.comment && (
                        <p className={`font-sans text-xs ${textSec} border ${borderC} p-2.5 rounded-lg italic max-w-xl break-all whitespace-pre-wrap ${isGym ? "bg-blue-950/40" : "bg-[#0a0807]"}`}>
                          &quot;{rev.comment}&quot;
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <StarDisplay rating={rev.rating} />
                      <p className={`font-mono text-[10px] ${textMut} mt-0.5`}>
                        {new Date(rev.createdAt).toLocaleDateString("es-EC", {
                          timeZone: "America/Guayaquil",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {visibleReviewsCount < reviewsList.length && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleReviewsCount((prev) => prev + 20)}
                    className={`font-mono text-xs tracking-[0.2em] uppercase px-6 py-2 transition-colors ${textPri}`}
                    style={{ color: accent, borderWidth: 1, borderStyle: "solid", borderColor: `${accent}66` }}
                  >
                    Ver más (+20)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lista de staff (vista general) */}
      {selectedView === "general" && staffStats.length > 0 && (
        <div>
          <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textMut} mb-3`}>
            Por Profesional
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {staffStats
              .sort((a, b) => b.avgRating - a.avgRating)
              .map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  isSelected={false}
                  onClick={() => handleSelectTab(staff.id)}
                  isGym={isGym}
                  accent={accent}
                  qrUrl={
                    whatsappNumber
                      ? buildStaffQrUrl(whatsappNumber, currentBoxCode, staff.name)
                      : ""
                  }
                />
              ))}
          </div>
        </div>
      )}

      {/* Nota calificaciones sin asignar */}
      {unassignedCount > 0 && selectedView === "general" && (
        <div className={`${bgCard} p-4`}>
          <p className={`font-mono text-[10px] ${textMut}`}>
            ℹ️ Hay {unassignedCount} calificaciones sin profesional asignado (registradas antes de activar la selección de equipo). Estas se incluyen en el promedio general.
          </p>
        </div>
      )}

      {/* Sin staff */}
      {staffStats.length === 0 && (
        <div className={`${bgCard} p-10 text-center`}>
          <p className={`font-display italic text-lg ${textMut} mb-2`}>
            No hay {isGym ? "entrenadores" : "barberos"} registrados
          </p>
          <p className={`font-mono text-[10px] ${textMut} tracking-widest`}>
            Ve a{" "}
            <a href="/panel/whatsapp" className="hover:underline" style={{ color: accent }}>
              Configuración
            </a>{" "}
            para agregar a tu equipo de trabajo.
          </p>
        </div>
      )}
    </div>
  );
}
