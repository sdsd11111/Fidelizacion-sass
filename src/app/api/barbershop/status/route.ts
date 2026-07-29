import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEvolutionStatus } from "@/lib/evolution";

export async function GET(request: NextRequest) {
  try {
    const barbershopId = request.headers.get("x-barbershop-id");
    if (!barbershopId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { evolutionInstance: true, connectionStatus: true, whatsappConnected: true, vertical: true },
    });

    if (!barbershop) {
      return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
    }

    // Consultar el estado real directo de Evolution API
    const realStatus = await getEvolutionStatus(barbershop.evolutionInstance);

    // Mapear estado al enum interno
    let internalStatus = "DISCONNECTED";
    if (realStatus === "open" || realStatus === "connected") {
      internalStatus = "CONNECTED";
    } else if (realStatus === "connecting" || realStatus === "qrcode") {
      internalStatus = "WAITING_QR";
    }

    // Sincronizar en DB si difiere
    if (internalStatus !== barbershop.connectionStatus) {
      await prisma.barbershop.update({
        where: { id: barbershopId },
        data: { connectionStatus: internalStatus },
      });
    }

    // AUTO-SYNC WEBHOOK AUTOMÁTICO (SOLO GIMNASIOS):
    // Garantiza que el webhook del gimnasio apunte a este Vercel sin tocar las barberías en producción
    if (internalStatus === "CONNECTED" && barbershop.vertical === "GIMNASIO") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      let webhookUrl = `${baseUrl}/api/webhook/whatsapp`;
      if (!baseUrl) {
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const host = request.headers.get("host") || "fidelizacion-sass.vercel.app";
        webhookUrl = `${protocol}://${host}/api/webhook/whatsapp`;
      }
      const { configureEvolutionWebhook } = await import("@/lib/evolution");
      configureEvolutionWebhook(barbershop.evolutionInstance, webhookUrl).catch((err) =>
        console.error("[Auto-Sync Webhook Gym] Error:", err)
      );
    }

    return NextResponse.json({
      status: internalStatus,
      whatsappConnected: barbershop.whatsappConnected,
      barbershopId: barbershopId,
    });
  } catch (error) {
    console.error("[GET /api/barbershop/status] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
