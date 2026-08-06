// filepath: src/components/redesign/PanelHero.tsx
import { type ReactNode } from "react";

interface PanelHeroProps {
  /** URL de la imagen de fondo (Unsplash, /public, etc.). */
  imageUrl: string;
  /** Texto eyebrow en monoespaciada uppercase. */
  eyebrow?: string;
  /** Badge opcional a la derecha del eyebrow (ej. "PLAN PREMIUM"). */
  badge?: ReactNode;
  /** Título principal en serif. */
  title: string;
  /** Subtítulo / descripción corta. */
  subtitle?: string;
  /** Acción a la derecha (botón píldora). */
  action?: ReactNode;
  /** Altura mínima. Default 320px en desktop, 280px en móvil. */
  minHeight?: number;
  /** Contenido flotante extra que se renderiza debajo del degradado (glass cards). */
  overlay?: ReactNode;
  /** Posición de la imagen. Default "center". */
  imagePosition?: string;
  /** Color de acento de marca para la viñeta y resplandor. */
  accentColor?: string;
  /** Vertical del negocio para adaptar fondos. */
  vertical?: string;
}

/**
 * Hero "a sangre completa" con imagen real de fondo y degradado oscuro
 * que se funde con el fondo negro del panel. Mantiene la paleta de marca.
 */
export default function PanelHero({
  imageUrl,
  eyebrow,
  badge,
  title,
  subtitle,
  action,
  minHeight = 320,
  overlay,
  imagePosition = "center",
  accentColor = "rgba(217,118,68,0.45)",
  vertical = "BARBERIA",
}: PanelHeroProps) {
  const isGym = vertical === "GIMNASIO";
  const bgHex = "var(--theme-bg, #09090b)";
  const borderColor = "var(--theme-border, #2a2520)";
  return (
    <section
      className="relative w-full rounded-3xl border"
      style={{ minHeight: `${minHeight}px`, borderColor }}
    >
      {/* CAPA CON OVERFLOW-HIDDEN: solo para la imagen y degradados.
          Está fuera del flujo para no bloquear el scroll horizontal
          de los hijos del contenido (los tabs). */}
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-3xl">
        {/* IMAGEN DE FONDO */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: bgHex,
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: imagePosition,
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* DEGRADADO INFERIOR — oscurece la zona donde va el texto
            en móvil (imagen completa → negro al 90% en el bottom). */}
        <div
          className="absolute inset-0"
          style={{
            background:
              `linear-gradient(180deg, rgba(9,9,11,0.45) 0%, rgba(9,9,11,0.15) 30%, rgba(9,9,11,0.55) 55%, rgba(9,9,11,0.95) 88%, #09090b 100%)`,
          }}
        />
        {/* DEGRADADO LATERAL — refuerza el lado izquierdo en desktop
            donde se asienta el bloque de texto. */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              `linear-gradient(90deg, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.65) 35%, rgba(9,9,11,0.25) 65%, rgba(9,9,11,0.05) 100%)`,
          }}
        />

        {/* VIÑETA ACENTO — acento de marca */}
        <div
          className="absolute inset-0 mix-blend-overlay opacity-30"
          style={{
            background:
              `radial-gradient(circle at 85% 15%, ${accentColor} 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* CONTENIDO — fuera del overflow-hidden, así puede scrollear */}
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-end p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {/* BLOQUE DE TEXTO — envuelto en glass card semitransparente
              para garantizar legibilidad sobre cualquier imagen. */}
          <div className="relative max-w-2xl space-y-3">
            {/* Glass sutil SOLO detrás del texto (no afecta a la imagen). */}
            <div
              aria-hidden
              className="absolute -inset-x-3 -inset-y-4 sm:-inset-x-4 sm:-inset-y-5 -z-10 rounded-2xl backdrop-blur-[2px]"
              style={{ backgroundColor: `${bgHex}8c` }}
            />

            {(eyebrow || badge) && (
              <div className="flex flex-wrap items-center gap-2">
                {eyebrow && (
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#f3ece1]"
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                  >
                    {eyebrow}
                  </span>
                )}
                {badge}
              </div>
            )}
            <h1
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.05] text-[#f3ece1]"
              style={{
                // Triple drop-shadow apilado: da peso y halo oscuro
                // sin importar qué color tenga la imagen detrás.
                textShadow:
                  "0 2px 4px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.9)",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-sm sm:text-base text-[#f3ece1] max-w-xl leading-relaxed font-medium"
                style={{
                  textShadow:
                    "0 1px 2px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.65)",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {action && <div className="shrink-0 relative z-10">{action}</div>}
        </div>

        {overlay && <div className="mt-6 lg:mt-8 -mx-6 sm:-mx-8 lg:-mx-10">{overlay}</div>}
      </div>
    </section>
  );
}