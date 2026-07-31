import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "JWT_SECRET_SUPER_CONFIDENCIAL_DESARROLLO_LOCAL"
);

/**
 * Manifest dinámico multi-tenant.
 *
 * - Si la cookie de sesión pertenece a un GIMNASIO, devuelve branding GymOS.
 * - Si pertenece a una BARBERÍA (o no hay sesión), devuelve branding BarberOS.
 *
 * Next.js expone este archivo en /manifest.json automáticamente.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let vertical: "BARBERIA" | "GIMNASIO" = "BARBERIA";

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (sessionCookie) {
      const { payload } = await jose.jwtVerify(sessionCookie, JWT_SECRET);
      if (payload.vertical === "GIMNASIO") {
        vertical = "GIMNASIO";
      }
    }
  } catch {
    // Si el token es inválido o no se puede verificar, mantenemos BARBERIA por default.
  }

  if (vertical === "GIMNASIO") {
    return {
      name: "GymOS Panel de Gimnasio",
      short_name: "GymOS",
      description:
        "Sistema inteligente de fidelización y gestión para gimnasios. Asistencia, retención y avisos automáticos por WhatsApp.",
      start_url: "/panel",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#111827",
      theme_color: "#3b82f6",
      lang: "es-EC",
      icons: [
        {
          src: "/logos/gymos_isotipo_192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/logos/gymos_isotipo_512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/logos/gymos_isotipo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };
  }

  // BARBERIA (default)
  return {
    name: "BarberOS Panel de Barbería",
    short_name: "BarberOS",
    description:
      "Sistema inteligente de fidelización y gestión para barberías. Cortes, retención y avisos automáticos por WhatsApp.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0807",
    theme_color: "#d97644",
    lang: "es-EC",
    icons: [
      {
        src: "/logos/barberos_isotipo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/barberos_isotipo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/barberos_isotipo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
