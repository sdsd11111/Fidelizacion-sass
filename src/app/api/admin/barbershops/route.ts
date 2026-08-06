import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeWhatsapp } from "@/lib/phone";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "SUPER_ADMIN_PASSWORD_LOCAL_TEST";

function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return false;
  }
  return true;
}

import { createEvolutionInstance, configureEvolutionWebhook, deleteEvolutionInstance } from "@/lib/evolution";

const CreateBarbershopSchema = z.object({
  name: z.string().min(1),
  whatsappNumber: z.string().min(1),
  requiredCuts: z.number().default(5),
  googleMapsUrl: z.string().optional(),
  salesAgent: z.string().optional(),
  ownerPhone: z.string().optional(),
  planType: z.enum(["PRO", "PREMIUM"]).default("PRO"),
  // Vertical del negocio: GIMNASIO (por defecto obligatoria).
  vertical: z.enum(["BARBERIA", "GIMNASIO"]).default("GIMNASIO"),
});

// GET /api/admin/barbershops - Listar todas las barberías
export async function GET(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const barbershops = await prisma.barbershop.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(barbershops);
  } catch (error) {
    console.error("[Admin GET API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/barbershops - Crear barbería (14 días trial por defecto) + Creación dinámica de WhatsApp
export async function POST(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateBarbershopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const whatsapp = normalizeWhatsapp(data.whatsappNumber);

    // EXCEPCIÓN DE PRUEBAS: el número 593967491847 pertenece al dueño y se reutiliza
    // constantemente para probar el flujo. Permitimos re-crear el registro eliminándolo
    // previamente si ya existe. NO aplicar a otros números.
    const TEST_WHATSAPP_NUMBERS = new Set(["593967491847"]);
    if (TEST_WHATSAPP_NUMBERS.has(whatsapp)) {
      try {
        const existing = await prisma.barbershop.findFirst({ where: { whatsappNumber: whatsapp } });
        if (existing) {
          // Limpiar registros dependientes antes de eliminar (mismo orden que DELETE endpoint)
          const customers = await prisma.barberCustomer.findMany({ where: { barbershopId: existing.id }, select: { id: true } });
          const customerIds = customers.map((c) => c.id);
          if (customerIds.length > 0) {
            await prisma.barberVisit.deleteMany({ where: { customerId: { in: customerIds } } });
          }
          // Limpiar visitas por barbershopId directamente (pueden tener profileId sin customerId)
          await prisma.barberVisit.deleteMany({ where: { barbershopId: existing.id } });
          // Limpiar perfiles de clientes
          await prisma.customerProfile.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.barberCustomer.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.barberStaff.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.magicToken.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.pushSubscription.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.motorSnapshot.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.testExclusion.deleteMany({ where: { barbershopId: existing.id } });
          await prisma.barbershop.delete({ where: { id: existing.id } });
        }
      } catch (cleanupError) {
        console.warn("[Admin POST API] Test number cleanup failed (non-critical):", cleanupError);
        // Continuar con la creación — el registro puede haber sido eliminado concurrentemente
      }
    }

    // Nombre dinámico de la instancia basada en el nombre de la barbería
    const evolutionInstanceName = `barber_${whatsapp}`;

    // Intentar crear la instancia en Evolution API
    const instanceCreated = await createEvolutionInstance(evolutionInstanceName);
    if (!instanceCreated) {
      return NextResponse.json(
        { error: "No se pudo inicializar la instancia de WhatsApp en el servidor. Revisa credenciales de Evolution API." },
        { status: 500 }
      );
    }

    // Configurar webhook automático apuntando al dominio actual / NEXT_PUBLIC_BASE_URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    let webhookUrl = `${baseUrl}/api/webhook/whatsapp`;
    if (!baseUrl) {
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("host") || "fidelizacion-sass.vercel.app";
      webhookUrl = `${protocol}://${host}/api/webhook/whatsapp`;
    }
    await configureEvolutionWebhook(evolutionInstanceName, webhookUrl);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 días en el futuro

    // Generar un PIN aleatorio numérico único de 6 dígitos
    const loginPin = Math.floor(100000 + Math.random() * 900000).toString();

    const barbershop = await prisma.barbershop.create({
      data: {
        name: data.name,
        whatsappNumber: whatsapp,
        evolutionInstance: evolutionInstanceName,
        evolutionApiKey: "", // Se usará la global por defecto
        requiredCuts: data.requiredCuts,
        googleMapsUrl: data.googleMapsUrl || null,
        ownerPhone: data.ownerPhone || null,
        salesAgent: data.salesAgent?.trim() || null,
        planStatus: "TRIAL",
        planType: data.planType || "PRO",
        vertical: data.vertical || "BARBERIA",
        trialEndsAt,
        connectionStatus: "DISCONNECTED",
        loginPin,
      },
    });

    // Enviar webhook a barberosplus.com (SÍNCRONO - esperamos respuesta)
    let commissionData: {
      hasCommission: boolean;
      commissionStatus: string;
      referredByName: string | null;
      referredByCode: string | null;
    } = {
      hasCommission: false,
      commissionStatus: "PENDING",
      referredByName: null,
      referredByCode: null,
    };

    if (data.name && data.whatsappNumber) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

        const webhookResponse = await fetch(
          process.env.BARBEROSPLUS_WEBHOOK_URL || "https://barberosplus.com/api/webhook/new-barbershop",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REFERRAL_WEBHOOK_KEY || "",
            },
            body: JSON.stringify({
              event: "barbershop_created",
              barbershop: {
                name: data.name,
                phoneBusiness: data.whatsappNumber,
                phonePersonal: data.ownerPhone || null,
                plan: data.planType || "PRO",
              },
              timestamp: new Date().toISOString(),
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (webhookResponse.ok) {
          const result = await webhookResponse.json();
          commissionData = {
            hasCommission: result.hasCommission === true,
            commissionStatus: result.hasCommission ? "CONFIRMED" : "NO_COMMISSION",
            referredByName: result.referredBy?.name || null,
            referredByCode: result.referredBy?.code || null,
          };
        }
      } catch (error) {
        console.error("[Webhook barberosplus] Error o timeout:", error);
        // commissionData queda en PENDING
      }
    }

    // Actualizar barbería con datos de comisión (envuelto en try-catch para no romper el flujo)
    let finalBarbershop = barbershop;
    try {
      finalBarbershop = await prisma.barbershop.update({
        where: { id: barbershop.id },
        data: {
          hasCommission: commissionData.hasCommission,
          commissionStatus: commissionData.commissionStatus,
          referredByName: commissionData.referredByName,
          referredByCode: commissionData.referredByCode,
        },
      });
    } catch (updateError) {
      console.error("[Admin POST API] Error al actualizar comisión (no crítico):", updateError);
      // El negocio ya fue creado exitosamente, retornamos el registro original
    }

    return NextResponse.json(finalBarbershop, { status: 201 });
  } catch (error) {
    console.error("[Admin POST API] Error:", error);
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "El número de WhatsApp ya está registrado." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

const UpdateBarbershopSchema = z.object({
  barbershopId: z.string().min(1),
  planStatus: z.enum(["TRIAL", "ACTIVE", "SUSPENDED"]).optional(),
  planType: z.enum(["PRO", "PREMIUM"]).optional(),
  name: z.string().min(1).optional(),
  whatsappNumber: z.string().min(1).optional(),
  requiredCuts: z.number().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  salesAgent: z.string().nullable().optional(),
});

// PATCH /api/admin/barbershops - Cambiar planStatus/planType manualmente o editar datos de la barbería
export async function PATCH(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = UpdateBarbershopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { barbershopId, planStatus, planType, name, whatsappNumber, requiredCuts, googleMapsUrl, salesAgent } = parsed.data;

    // Construir data de actualización de forma dinámica
    const updateData: any = {};
    if (planStatus !== undefined) updateData.planStatus = planStatus;
    if (planType !== undefined) updateData.planType = planType;
    if (name !== undefined) updateData.name = name;
    if (requiredCuts !== undefined) updateData.requiredCuts = requiredCuts;
    if (googleMapsUrl !== undefined) updateData.googleMapsUrl = googleMapsUrl;
    if (salesAgent !== undefined) updateData.salesAgent = salesAgent;
    
    if (whatsappNumber !== undefined) {
      updateData.whatsappNumber = normalizeWhatsapp(whatsappNumber);
    }

    const updated = await prisma.barbershop.update({
      where: { id: barbershopId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin PATCH API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/admin/barbershops - Eliminar barbería + instancia Evolution
export async function DELETE(request: NextRequest) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const barbershopId = searchParams.get("id");

    if (!barbershopId) {
      return NextResponse.json({ error: "Se requiere el ID de la barbería" }, { status: 400 });
    }

    // Buscar la barbería para obtener la instancia de Evolution
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
    });

    if (!barbershop) {
      return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
    }

    // Eliminar la instancia de Evolution API
    await deleteEvolutionInstance(barbershop.evolutionInstance);

    // Obtener los IDs de clientes asociados a la barbería para borrar sus visitas
    const customers = await prisma.barberCustomer.findMany({
      where: { barbershopId },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    // Eliminar datos relacionados en orden
    await prisma.barberVisit.deleteMany({
      where: {
        customerId: {
          in: customerIds,
        },
      },
    });
    await prisma.barberCustomer.deleteMany({ where: { barbershopId } });
    await prisma.barberStaff.deleteMany({ where: { barbershopId } });
    await prisma.magicToken.deleteMany({ where: { barbershopId } });

    // Eliminar la barbería
    await prisma.barbershop.delete({ where: { id: barbershopId } });

    return NextResponse.json({ success: true, message: `Barbería "${barbershop.name}" eliminada correctamente.` });
  } catch (error) {
    console.error("[Admin DELETE API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

