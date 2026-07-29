import "server-only";
import * as jose from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "JWT_SECRET_SUPER_CONFIDENCIAL_DESARROLLO_LOCAL"
);

export interface SessionPayload {
  barbershopId: string;
  planStatus: string;
  trialEndsAt: string | null;
  role: string;
  vertical: string; // "BARBERIA" | "GIMNASIO"
}

/**
 * Descifra y verifica un JWT de sesión.
 * Retorna el payload si es válido, o null si expiró/es inválido.
 */
export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Elimina la cookie de sesión activa.
 * Usar desde una Server Action de logout.
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
