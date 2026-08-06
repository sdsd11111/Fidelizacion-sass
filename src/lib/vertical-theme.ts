/**
 * vertical-theme.ts — Sistema de theming por vertical de negocio.
 *
 * Centraliza TODOS los colores, textos y branding que cambian entre
 * Barbería y Gimnasio. Ningún componente debe hardcodear estos valores;
 * siempre deben consumir `getTheme(vertical)`.
 *
 * IMPORTANTE: Este archivo NO altera la lógica de fidelización ni las APIs.
 * Solo controla la presentación visual.
 */

export type Vertical = "BARBERIA" | "GIMNASIO";

export interface VerticalColors {
  /** Fondo principal de la app */
  bgPrimary: string;
  /** Fondo de cards/paneles */
  bgCard: string;
  /** Bordes */
  border: string;
  /** Color de acento principal (botones, links activos, decoraciones) */
  accent: string;
  /** Color de acento en hover */
  accentHover: string;
  /** Texto principal (títulos, contenido) */
  textPrimary: string;
  /** Texto secundario (labels, hints) */
  textSecondary: string;
  /** Texto medio (contenido menos importante) */
  textMuted: string;
  /** Acento en Tailwind para clases como bg-[x] */
  accentBg: string;
  /** Top bar decorativa */
  topBar: string;
}

export interface VerticalTexts {
  brand: string;
  loginTitle: string;
  loginSubtitle: string;
  loginPinLabel: string;
  loginButton: string;
  loginSuccess: string;
  /** Término para el servicio principal: "cortes" vs "asistencias" */
  serviceUnit: string;
  serviceUnitSingular: string;
  /** Término para el negocio */
  businessName: string;
  businessNameArticle: string;
  /** Término para los trabajadores */
  staffName: string;
  staffNameSingular: string;
  /** Nav label para la sección de staff */
  navStaff: string;
  /** Dashboard health messages */
  healthExcellent: string;
  healthStable: string;
  healthAttention: (overdueCount: number) => string;
  /** Registro de clientes */
  registrationSubtitle: string;
  /** Error cuando no se encuentra */
  notFoundError: string;
  /** Placeholder del nombre de negocio */
  businessPlaceholder: string;
}

export interface VerticalTheme {
  vertical: Vertical;
  colors: VerticalColors;
  texts: VerticalTexts;
}

// ═══════════════════════════════════════════════════
// TEMA: BARBERÍA (actual — NO se modifica)
// ═══════════════════════════════════════════════════
const BARBERIA_COLORS: VerticalColors = {
  bgPrimary: "#0a0807",
  bgCard: "#131110",
  border: "#2a2520",
  accent: "#d97644",
  accentHover: "#e8854f",
  textPrimary: "#f3ece1",
  textSecondary: "#5c554c",
  textMuted: "#a89e90",
  accentBg: "#d97644",
  topBar: "#d97644",
};

const BARBERIA_TEXTS: VerticalTexts = {
  brand: "BarberOS",
  loginTitle: "BarberOS",
  loginSubtitle: "Acceso rápido por PIN",
  loginPinLabel: "Código PIN de Barbería",
  loginButton: "INGRESAR AL PANEL",
  loginSuccess: "¡Acceso correcto! Redirigiendo...",
  serviceUnit: "cortes",
  serviceUnitSingular: "corte",
  businessName: "barbería",
  businessNameArticle: "la barbería",
  staffName: "barberos",
  staffNameSingular: "barbero",
  navStaff: "Barberos",
  healthExcellent: "Tu barbería está muy saludable. Esta semana registraste un alto retorno de clientes.",
  healthStable: "Tu barbería está estable. Te recomendamos recordarles su corte a los clientes en límite 0.8x.",
  healthAttention: (n: number) =>
    `Atención requerida: tienes ${n} clientes que han superado su frecuencia habitual de corte (límite 1.2x).`,
  registrationSubtitle: "Completa tus datos para empezar a acumular cortes gratis y acceder a tus beneficios.",
  notFoundError: "Barbería no encontrada",
  businessPlaceholder: "Ej. Barbería El Elegante",
};

// ═══════════════════════════════════════════════════
// TEMA: GIMNASIO
// ═══════════════════════════════════════════════════
const GIMNASIO_COLORS: VerticalColors = {
  bgPrimary: "#09090b",   // zinc-950 — fondo oscuro neutral unificado
  bgCard: "#18181b",      // zinc-900 — superficie de tarjetas neutra fría
  border: "#27272a",      // zinc-800 — borde neutral sutil
  accent: "#3b82f6",      // blue-500 — fallback si no hay logo subido
  accentHover: "#60a5fa",
  textPrimary: "#e4e4e7", // zinc-200 — texto principal neutro frío
  textSecondary: "#71717a", // zinc-500 — texto secundario neutro
  textMuted: "#a1a1aa",   // zinc-400 — texto muted neutro
  accentBg: "#3b82f6",
  topBar: "#3b82f6",
};

const GIMNASIO_TEXTS: VerticalTexts = {
  brand: "GymOS",
  loginTitle: "GymOS",
  loginSubtitle: "Acceso rápido por PIN",
  loginPinLabel: "Código PIN del Gimnasio",
  loginButton: "INGRESAR AL PANEL",
  loginSuccess: "¡Acceso correcto! Redirigiendo...",
  serviceUnit: "asistencias",
  serviceUnitSingular: "asistencia",
  businessName: "gimnasio",
  businessNameArticle: "el gimnasio",
  staffName: "entrenadores",
  staffNameSingular: "entrenador",
  navStaff: "Entrenadores",
  healthExcellent: "Tu gimnasio está muy saludable. Esta semana registraste un alto retorno de miembros.",
  healthStable: "Tu gimnasio está estable. Te recomendamos recordarles su rutina a los miembros en límite 0.8x.",
  healthAttention: (n: number) =>
    `Atención requerida: tienes ${n} miembros que han superado su frecuencia habitual de asistencia (límite 1.2x).`,
  registrationSubtitle: "Completa tus datos para empezar a acumular asistencias y acceder a tus beneficios exclusivos.",
  notFoundError: "Gimnasio no encontrado",
  businessPlaceholder: "Ej. Iron Gym Fitness",
};

// ═══════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════

const THEMES: Record<Vertical, VerticalTheme> = {
  BARBERIA: { vertical: "BARBERIA", colors: BARBERIA_COLORS, texts: BARBERIA_TEXTS },
  GIMNASIO: { vertical: "GIMNASIO", colors: GIMNASIO_COLORS, texts: GIMNASIO_TEXTS },
};

export interface CustomBranding {
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
  brandAccentColor?: string | null;
}

function isDarkColor(hex?: string | null): boolean {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.15;
}

/**
 * Obtiene el tema completo (colores + textos) para una vertical, aplicando opcionalmente los colores personalizados del logo del negocio.
 */
export function getTheme(vertical?: string | null, customBranding?: CustomBranding): VerticalTheme {
  const baseTheme = (vertical && vertical in THEMES) ? THEMES[vertical as Vertical] : THEMES.BARBERIA;

  if (!customBranding || (!customBranding.brandPrimaryColor && !customBranding.brandSecondaryColor && !customBranding.brandAccentColor)) {
    return baseTheme;
  }

  const primary = customBranding.brandPrimaryColor || baseTheme.colors.accent;

  const customColors: VerticalColors = {
    ...baseTheme.colors,
    bgPrimary: "#09090b", // zinc-950 — fondo unificado oscuro neutro
    bgCard: "#18181b",    // zinc-900 — tarjetas neutras frías (sin café ni oliva)
    border: `${primary}33`, // borde suave del color del logo
    accent: primary,
    accentBg: primary,
    topBar: primary,
    accentHover: customBranding.brandAccentColor || primary,
    textPrimary: "#e4e4e7",  // zinc-200 — neutro frío
    textSecondary: "#a1a1aa", // zinc-400 — neutro frío
    textMuted: "#71717a",     // zinc-500 — neutro frío
  };

  return {
    ...baseTheme,
    colors: customColors,
  };
}

/**
 * Helper para CSS inline styles desde los colores del tema y branding del logo.
 */
export function themeStyles(vertical?: string | null, customBranding?: CustomBranding) {
  const { colors } = getTheme(vertical, customBranding);
  return {
    // Sobreescribe las variables globales de globals.css con los colores del branding
    "--accent": colors.accent,
    "--background": colors.bgPrimary,
    "--card": colors.bgCard,
    "--border": colors.border,
    "--foreground": colors.textPrimary,
    "--muted": colors.textSecondary,
    // Variables de tema
    "--theme-bg": colors.bgPrimary,
    "--theme-card": colors.bgCard,
    "--theme-border": colors.border,
    "--theme-accent": colors.accent,
    "--theme-accent-hover": colors.accentHover,
    "--theme-text": colors.textPrimary,
    "--theme-text-secondary": colors.textSecondary,
    "--theme-text-muted": colors.textMuted,
    "--brand-primary": colors.accent,
    "--brand-secondary": colors.bgCard,
    "--brand-accent": colors.accentHover,
  } as React.CSSProperties;
}

