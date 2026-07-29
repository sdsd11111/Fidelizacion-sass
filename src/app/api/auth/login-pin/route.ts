import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "JWT_SECRET_SUPER_CONFIDENCIAL_DESARROLLO_LOCAL"
);

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string" || pin.trim().length === 0) {
      return NextResponse.json({ error: "Por favor, ingresa un PIN válido." }, { status: 400 });
    }

    // Buscar la barbería que tenga este PIN de ingreso
    const barbershop = await prisma.barbershop.findFirst({
      where: { loginPin: pin.trim() },
    });

    if (!barbershop) {
      return NextResponse.json({ error: "El código PIN ingresado es incorrecto." }, { status: 401 });
    }

    // Generar JWT válido por 365 días (1 año) para que la sesión sea permanente
    const jwt = await new jose.SignJWT({
      barbershopId: barbershop.id,
      planStatus: barbershop.planStatus,
      trialEndsAt: barbershop.trialEndsAt?.toISOString() || null,
      role: "OWNER",
      vertical: barbershop.vertical || "BARBERIA",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("365d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, message: "Autenticación exitosa.", vertical: barbershop.vertical || "BARBERIA" });

    // Guardar la sesión en la cookie (permanente por 1 año, configurable para PWA/móviles)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    response.cookies.set("session", jwt, {
      httpOnly: true,
      secure: true, // Siempre secure para cookies persistentes en PWA
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 365 días
      expires: oneYearFromNow, // Clave para mantener activa la cookie en Safari/Chrome de móviles tras reiniciar
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login PIN API] Error:", error);
    return NextResponse.json({ error: "Error interno al autenticar." }, { status: 500 });
  }
}
