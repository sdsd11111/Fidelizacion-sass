// filepath: src/components/redesign/MetricTile.tsx
"use client";

import Link from "next/link";
import { type ReactNode } from "react";

type Accent = "orange" | "amber" | "green" | "neutral";

interface MetricTileProps {
  label: string;
  /** Valor principal grande (ej. "5.0", "15", "13%"). */
  value: string | number;
  /** Subtítulo descriptivo debajo del número. */
  caption?: string;
  /** Footer pequeño (ej. "+1 este mes"). */
  footer?: ReactNode;
  /** Color de acento del valor. Default "neutral". */
  accent?: Accent;
  /** Icono/emoji del header. */
  icon?: ReactNode;
  /** Si es link, hace la card entera clickable. */
  href?: string;
  /** Click handler (alternativa a href). */
  onClick?: () => void;
  /** Contenido opcional a la derecha del header. */
  headerExtra?: ReactNode;
  className?: string;
  vertical?: string;
}

const accentMap: Record<
  Accent,
  { value: string; ring: string; footerText: string; bg: string; border: string }
> = {
  orange: {
    value: "text-[#d97644]",
    ring: "from-[#e89263] to-[#d97644]",
    footerText: "text-[#d97644]",
    bg: "bg-[#d97644]/10",
    border: "border-[#d97644]/30",
  },
  amber: {
    value: "text-[#e8a33d]",
    ring: "from-[#f0b04e] to-[#e8a33d]",
    footerText: "text-[#e8a33d]",
    bg: "bg-[#e8a33d]/10",
    border: "border-[#e8a33d]/30",
  },
  green: {
    value: "text-emerald-400",
    ring: "from-emerald-300 to-emerald-500",
    footerText: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  neutral: {
    value: "text-[#f3ece1]",
    ring: "from-[#a89e90] to-[#5c554c]",
    footerText: "text-[#a89e90]",
    bg: "bg-[#f3ece1]/5",
    border: "border-[#3a2f25]/80",
  },
};

export default function MetricTile({
  label,
  value,
  caption,
  footer,
  accent = "neutral",
  icon,
  href,
  onClick,
  headerExtra,
  className = "",
  vertical = "BARBERIA",
}: MetricTileProps) {
  const isGym = vertical === "GIMNASIO";
  const a = accentMap[accent];

  // Ajustes de acentos para gimnasio cuando no es un estado específico (ej. verde)
  const isAccentOrangeOrAmber = accent === "orange" || accent === "amber";

  const valueColor = isAccentOrangeOrAmber ? "text-[var(--brand-primary)]" : accent === "neutral" ? "text-[#e2e8f0]" : a.value;
  const iconBg = isAccentOrangeOrAmber ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]" : a.bg;

  const content = (
    <div
      style={{
        backgroundColor: "var(--theme-card, #131110)",
        borderColor: "var(--theme-border, rgba(255,255,255,0.15))",
      }}
      className={[
        "group relative rounded-2xl p-5 sm:p-6 h-full border backdrop-blur-xl shadow-lg transition-all duration-200 ease-out",
        href || onClick ? "hover:-translate-y-0.5 hover:shadow-2xl cursor-pointer" : "",
        className,
      ].join(" ")}
    >
      {/* Línea superior sutil */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isGym ? "via-[#e2e8f0]/15" : "via-[#f3ece1]/15"} to-transparent`}
      />

      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span
              className={[
                "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm shrink-0",
                iconBg,
                !isGym && accent === "amber" ? "text-[#e8a33d]" : "",
                !isGym && accent === "orange" ? "text-[#d97644]" : "",
              ].join(" ")}
            >
              {icon}
            </span>
          )}
          <span className={`font-mono text-[10px] tracking-[0.25em] uppercase ${isGym ? "text-slate-400" : "text-[#a89e90]"} truncate`}>
            {label}
          </span>
        </div>
        {headerExtra}
      </div>

      {/* VALOR */}
      <div className="space-y-1">
        <p
          className={[
            "font-display text-4xl sm:text-5xl font-light leading-none group-hover:scale-[1.02] transition-transform",
            valueColor,
          ].join(" ")}
        >
          {value}
        </p>
        {caption && (
          <p className={`font-mono text-xs ${isGym ? "text-slate-300" : "text-[#a89e90]"} leading-relaxed`}>{caption}</p>
        )}
      </div>

      {/* FOOTER */}
      {footer && (
        <div
          className={[
            "mt-4 pt-3 border-t",
            isGym ? "border-[#1e293b]" : "border-[#3a2f25]/60",
            "font-mono text-[10px] flex items-center gap-1.5",
            isGym && isAccentOrangeOrAmber ? "text-[#3b82f6]" : a.footerText,
          ].join(" ")}
        >
          {footer}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className="block w-full text-left h-full"
    >
      {content}
    </button>
  );
}