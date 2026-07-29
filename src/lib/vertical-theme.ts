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
  bgPrimary: "#111827",   // slate-900 — fondo principal más claro que el negro puro
  bgCard: "#1e2d4a",      // azul-navy medio — cards con profundidad
  border: "#2d4a7a",      // borde azul visible
  accent: "#3b82f6",      // blue-500
  accentHover: "#60a5fa", // blue-400
  textPrimary: "#e2e8f0", // slate-200
  textSecondary: "#64748b", // slate-500
  textMuted: "#94a3b8",   // slate-400
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

/**
 * Obtiene el tema completo (colores + textos) para una vertical.
 * Siempre retorna un tema válido — default a BARBERIA si el valor es desconocido.
 */
export function getTheme(vertical?: string | null): VerticalTheme {
  if (vertical && vertical in THEMES) {
    return THEMES[vertical as Vertical];
  }
  return THEMES.BARBERIA;
}

/**
 * Helper para CSS inline styles desde los colores del tema.
 * Útil para componentes que usan className con Tailwind arbitrary values.
 */
export function themeStyles(vertical?: string | null) {
  const { colors } = getTheme(vertical);
  return {
    "--theme-bg": colors.bgPrimary,
    "--theme-card": colors.bgCard,
    "--theme-border": colors.border,
    "--theme-accent": colors.accent,
    "--theme-accent-hover": colors.accentHover,
    "--theme-text": colors.textPrimary,
    "--theme-text-secondary": colors.textSecondary,
    "--theme-text-muted": colors.textMuted,
  } as React.CSSProperties;
}
