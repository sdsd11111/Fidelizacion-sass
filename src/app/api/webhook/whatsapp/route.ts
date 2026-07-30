import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";
import { generateBoxCode } from "@/lib/boxcode";
import webpush from "web-push";
import { getEcuadorHour } from "@/lib/time-ec";

// Configurar credenciales VAPID globales para el envío de notificaciones push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:soporte@barberosoftware.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface WebhookPayload {
  event: string;
  instance?: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
      imageMessage?: {
        caption?: string;
      };
    };
  };
}

async function processMessage(payload: WebhookPayload) {
  // Validar evento y mensaje
  if (payload.event !== "messages.upsert") {
    return;
  }

  const message = payload.data?.message;
  if (!message) {
    return;
  }

  const messageText = (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    ""
  ).trim();

  if (!messageText) {
    return;
  }

  // Extraer número de teléfono
  const remoteJid = payload.data.key.remoteJid;
  const whatsapp = remoteJid.replace("@s.whatsapp.net", "");

  // Buscar barbería usando la instancia del webhook, con fallback
  const evolutionInstance = payload.instance;
  const barbershop = evolutionInstance
    ? await prisma.barbershop.findFirst({ where: { evolutionInstance } })
    : await prisma.barbershop.findFirst();

  if (!barbershop) {
    console.error("[Webhook WhatsApp] No se encontró ninguna barbería para la instancia:", evolutionInstance);
    return;
  }

  // Buscar o crear cliente para esta barbería específica (multi-tenant)
  let customer = await prisma.barberCustomer.findUnique({
    where: {
      barbershopId_whatsapp: {
        barbershopId: barbershop.id,
        whatsapp,
      },
    },
    include: {
      barbershop: true,
      profiles: true,
    },
  });

  // --- FLUJO DE CHECK-IN ---
  // Validar que el mensaje contenga EXACTAMENTE el código de caja activo de la barbería
  const currentCode = barbershop.currentBoxCode?.toUpperCase() || "";
  const isCheckInMessage = currentCode.length > 0 && messageText.toUpperCase().includes(currentCode);

  // --- FLUJO WALLET (CONSULTA DE SALDO EXCLUSIVO CON LA PALABRA "WALLET") ---
  const msgTrimmedLower = messageText.trim().toLowerCase();
  const isWalletBalanceQuery = msgTrimmedLower === "wallet" || msgTrimmedLower.includes("wallet");

  if (isWalletBalanceQuery) {
    const pushName = (payload.data as any)?.pushName || customer?.name || "Cliente";

    // Calcular el saldo total acumulado del cliente en este gimnasio/barbería
    const approvedTxs = await prisma.walletTransaction.findMany({
      where: {
        barbershopId: barbershop.id,
        customerPhone: whatsapp,
        status: "APPROVED",
      },
    });

    const totalBalance = approvedTxs.reduce((sum, item) => sum + item.credit, 0);
    const txCount = approvedTxs.length;

    const isGym = barbershop.vertical === "GIMNASIO";
    const emoji = isGym ? "💪" : "✂️";

    let balanceMessage = "";
    if (totalBalance > 0) {
      balanceMessage = [
        `💰 *Tu Saldo de Wallet en ${barbershop.name}* ${emoji}`,
        ``,
        `Hola ${pushName},`,
        `Tu saldo acumulado actual es: *$${totalBalance.toFixed(2)}*`,
        `Operaciones aprobadas: ${txCount}`,
        ``,
        `¡Puedes canjear tu saldo acumulado en tu próxima visita o compra! 🔥`,
      ].join("\n");
    } else {
      balanceMessage = [
        `💰 *Tu Saldo de Wallet en ${barbershop.name}* ${emoji}`,
        ``,
        `Hola ${pushName},`,
        `Actualmente tienes *$0.00* acumulados en tu Wallet.`,
        ``,
        `¡Escanea nuestros códigos QR de Tienda o Referidos para empezar a acumular saldo! ${emoji}`,
      ].join("\n");
    }

    await sendWhatsAppMessage({
      instance: barbershop.evolutionInstance,
      apiKey: barbershop.evolutionApiKey,
      to: whatsapp,
      message: balanceMessage,
    });
    return;
  }

  const isTiendaMsg = msgLower.includes("adquirí un producto") || msgLower.includes("adquirir un producto") || msgLower.includes("adquirió un producto");
  const isMensualidadMsg = msgLower.includes("referí a un nuevo miembro") || msgLower.includes("referi a un nuevo miembro");

  // Validar que el mensaje contenga el código de caja activo (seguridad anti-spam)
  const msgContainsCode = currentCode.length > 0 && messageText.toUpperCase().includes(currentCode);

  if (isTiendaMsg || isMensualidadMsg) {
    const pushName = (payload.data as any)?.pushName || "Cliente";

    if (isTiendaMsg) {
      await prisma.walletTransaction.create({
        data: {
          barbershopId: barbershop.id,
          customerName: pushName,
          customerPhone: whatsapp,
          type: "TIENDA",
          status: "PENDING",
        },
      });

      // Generar nuevo código de caja rotativo para actualizar los QRs en vivo
      const { generateBoxCode } = await import("@/lib/boxcode");
      const newCode = generateBoxCode();
      await prisma.barbershop.update({
        where: { id: barbershop.id },
        data: { currentBoxCode: newCode },
      });

      sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: `🛍️ *¡Solicitud de Tienda recibida!*\n\nHola ${pushName}, tu compra ha sido enviada al administrador del gimnasio para su verificación.\n\nUna vez verificada, se acreditará tu saldo en la Wallet. 💪`,
      }).catch((e) => console.error("[Wallet Tienda WA Error]:", e));

      // Push notification al admin: nueva compra en tienda
      prisma.pushSubscription
        .findMany({ where: { barbershopId: barbershop.id } })
        .then((subs) => {
          const pushPayload = JSON.stringify({
            title: "🛍️ ¡Nueva compra en Tienda!",
            body: `${pushName} (+${whatsapp}) solicita verificación de compra en tienda.`,
            url: "/panel/wallet",
          });
          subs.forEach((sub) => {
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            ).catch((err) => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
              }
            });
          });
        })
        .catch((e) => console.error("[WebPush Tienda] Error:", e));

      return;
    }

    if (isMensualidadMsg) {
      // Generar nuevo código de caja rotativo para actualizar los QRs en vivo
      const { generateBoxCode } = await import("@/lib/boxcode");
      const newCode = generateBoxCode();
      await prisma.barbershop.update({
        where: { id: barbershop.id },
        data: { currentBoxCode: newCode },
      });

      // Buscar planes configurados
      const walletConfig = await prisma.walletConfig.findUnique({
        where: { barbershopId: barbershop.id },
      });

      const plans: Array<{ id: string; name: string; price: number; percentage: number }> =
        (walletConfig?.plans as any) || [];

      if (plans.length === 0) {
        sendWhatsAppMessage({
          instance: barbershop.evolutionInstance,
          apiKey: barbershop.evolutionApiKey,
          to: whatsapp,
          message: `💪 *¡Gracias por referir a un nuevo miembro!*\n\nTu referencia ha sido enviada al administrador del gimnasio para su confirmación.`,
        }).catch((e) => console.error("[Wallet Mensualidad WA Error]:", e));

        await prisma.walletTransaction.create({
          data: {
            barbershopId: barbershop.id,
            customerName: pushName,
            customerPhone: whatsapp,
            type: "MENSUALIDAD",
            status: "PENDING",
            planName: "General / Sin plan especificado",
          },
        });
      } else {
        // Notificar que se registró la mensualidad pendiente
        const plansListText = plans
          .map((p) => `• *${p.name}* ($${p.price}) → Comisión: ${p.percentage}%`)
          .join("\n");

        await prisma.walletTransaction.create({
          data: {
            barbershopId: barbershop.id,
            customerName: pushName,
            customerPhone: whatsapp,
            type: "MENSUALIDAD",
            status: "PENDING",
            planName: plans[0]?.name || "Plan Referido",
            amount: plans[0]?.price || 0,
            percentage: plans[0]?.percentage || 0,
            credit: ((plans[0]?.price || 0) * (plans[0]?.percentage || 0)) / 100,
          },
        });

        sendWhatsAppMessage({
          instance: barbershop.evolutionInstance,
          apiKey: barbershop.evolutionApiKey,
          to: whatsapp,
          message: `💪 *¡Referido registrado!*\n\nHola ${pushName}, recibimos tu reporte de referido. Se enviará a revisión con el administrador.\n\nPlanes disponibles para comisión:\n${plansListText}\n\n¡Gracias por hacer crecer la comunidad! 🔥`,
        }).catch((e) => console.error("[Wallet Mensualidad WA Error]:", e));
      }

      // Push notification al admin: nuevo referido de mensualidad
      prisma.pushSubscription
        .findMany({ where: { barbershopId: barbershop.id } })
        .then((subs) => {
          const pushPayload = JSON.stringify({
            title: "💪 ¡Nuevo Referido de Mensualidad!",
            body: `${pushName} (+${whatsapp}) reportó un referido. Revisa Wallet para aprobar.`,
            url: "/panel/wallet",
          });
          subs.forEach((sub) => {
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            ).catch((err) => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
              }
            });
          });
        })
        .catch((e) => console.error("[WebPush Mensualidad] Error:", e));

      return;
    }
  }

  // Extraer nombre público del perfil de WhatsApp (pushName)
  const pushName = (payload.data as any)?.pushName || null;

  if (isCheckInMessage) {
    if (!customer) {
      customer = await prisma.barberCustomer.create({
        data: {
          barbershopId: barbershop.id,
          whatsapp,
          name: pushName,
          cutsCount: 0,
          sessionState: "IDLE",
          profiles: {
            create: {
              barbershopId: barbershop.id,
              name: pushName || "Sin Nombre",
              cutsCount: 0,
            }
          }
        },
        include: {
          barbershop: true,
          profiles: true,
        },
      });
    } else if (!customer.name && pushName) {
      // Si el cliente ya existía pero no tenía nombre asignado, lo actualizamos
      customer = await prisma.barberCustomer.update({
        where: { id: customer.id },
        data: { name: pushName },
        include: {
          barbershop: true,
          profiles: true,
        },
      });
    }

    if (!customer) {
      // Failsafe for TS
      return NextResponse.json({ success: true });
    }

    // Si el cliente envía el código de caja, el check-in TIENE PRIORIDAD ABSOLUTA.
    // Limpiar cualquier visita PENDING anterior no procesada por el barbero
    await prisma.barberVisit.deleteMany({
      where: {
        customerId: customer.id,
        status: "PENDING",
      },
    });

    // Resetear cualquier estado de sesión previo congelado (ej: si no respondió una calificación previa)
    if (customer.sessionState !== "IDLE") {
      await prisma.barberCustomer.update({
        where: { id: customer.id },
        data: { sessionState: "IDLE" },
      });
      customer.sessionState = "IDLE";
    }

    // Detectar si el mensaje incluye el nombre del barbero (QR individual)
    // Formato esperado: "...Me atendió Carlos" o "...atendió Carlos"
    let preAssignedStaffId: string | null = null;
    const staffMatch = messageText.match(/atendi[oó]\s+(.+)/i);
    if (staffMatch) {
      const staffNameFromMsg = staffMatch[1].trim().replace(/[.,!?]+$/, "");
      const staffMembers = await prisma.barberStaff.findMany({
        where: { barbershopId: barbershop.id },
      });
      const matched = staffMembers.find((s) =>
        staffNameFromMsg.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matched) {
        preAssignedStaffId = matched.id;
      }
    }

    // Buscar perfil a usar
    let profileIdToUse = customer.activeProfileId;
    if (!profileIdToUse && customer.profiles && customer.profiles.length > 0) {
      profileIdToUse = customer.profiles[0].id;
      // Auto-reparar activeProfileId si estaba nulo
      await prisma.barberCustomer.update({
        where: { id: customer.id },
        data: { activeProfileId: profileIdToUse }
      });
    }

    const isGym = barbershop.vertical === "GIMNASIO";

    // Crear visita (con staffId pre-asignado si vino del QR del entrenador) + regenerar código EN PARALELO
    const newCode = generateBoxCode();
    await Promise.all([
      prisma.barberVisit.create({
        data: {
          customerId: customer.id,
          barbershopId: barbershop.id,   // Scoping multi-tenant explícito
          profileId: profileIdToUse,
          status: isGym ? "APPROVED" : "PENDING", // Gimnasio auto-aprueba la visita para calificar de inmediato
          rating: null,
          staffId: preAssignedStaffId,
          checkinMethod: "SELF",
          visitHour: getEcuadorHour(new Date()),
        },
      }),
      prisma.barbershop.update({
        where: { id: barbershop.id },
        data: { currentBoxCode: newCode },
      }),
    ]);

    if (isGym) {
      // En Gimnasio: auto-aprobar visita. Si hay entrenadores registrados, pedir selección de entrenador primero (AWAITING_STAFF)
      const staffMembers = await prisma.barberStaff.findMany({
        where: { barbershopId: barbershop.id },
        orderBy: { name: "asc" },
      });

      if (staffMembers.length > 0) {
        await prisma.barberCustomer.update({
          where: { id: customer.id },
          data: { sessionState: "AWAITING_STAFF" },
        });

        const optionsText = staffMembers
          .map((s, idx) => `${idx + 1}. ${s.name}`)
          .join("\n");

        sendWhatsAppMessage({
          instance: barbershop.evolutionInstance,
          apiKey: barbershop.evolutionApiKey,
          to: whatsapp,
          message: `💪 ¡Gracias por tu visita a ${barbershop.name}!\n\nPor favor, responde con el número de la persona o entrenador que te atendió hoy:\n\n${optionsText}`,
        }).catch((err) => console.error("[WA Reply Gym] Error:", err));
      } else {
        // Si no hay entrenadores creados, ir directo a calificar el gimnasio
        await prisma.barberCustomer.update({
          where: { id: customer.id },
          data: { sessionState: "AWAITING_RATING" },
        });

        sendWhatsAppMessage({
          instance: barbershop.evolutionInstance,
          apiKey: barbershop.evolutionApiKey,
          to: whatsapp,
          message: `💪 ¡Gracias por tu visita a ${barbershop.name}!\n\nDel 1 al 5, ¿cómo calificas tu experiencia hoy? ⭐`,
        }).catch((err) => console.error("[WA Reply Gym] Error:", err));
      }
    } else {
      // PRIORIDAD 1: Enviar respuesta por WhatsApp PRIMERO (latencia mínima para el cliente)
      sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: "¡Gracias! Avisándole a tu barbero para registrar tu corte. ✂️",
      }).catch((err) => console.error("[WA Reply] Error:", err));
    }

    // PRIORIDAD 2: Enviar notificaciones push al barbero en segundo plano (no bloquea)
    // En gimnasio NO se envían push de check-in (auto-aprobación directa a calificación)
    if (!isGym) {
      prisma.pushSubscription
        .findMany({
          where: { barbershopId: barbershop.id },
        })
        .then((subs) => {
          const customerName = customer?.name || "Cliente Frecuente";
          const pushPayload = JSON.stringify({
            title: "✂️ ¡Nuevo Check-In!",
            body: `El cliente "${customerName}" (+${whatsapp}) ha solicitado registrar su corte.`,
            url: "/panel",
          });

          subs.forEach((sub) => {
            webpush
              .sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                  },
                },
                pushPayload
              )
              .catch((err) => {
                console.error("[WebPush] Fallo al notificar a endpoint:", sub.endpoint, err.message);
                if (err.statusCode === 410 || err.statusCode === 404) {
                  prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                }
              });
          });
        })
        .catch((e) => console.error("[WebPush] Error buscando suscripciones:", e));
    }

    return;
  }

  // Si no es CHECKIN ni genérico, validamos que el cliente exista en el sistema
  if (!customer) {
    return;
  }

  // Máquina de estados para selección de profesional o calificaciones
  if (customer.sessionState === "AWAITING_STAFF") {
    const staffMembers = await prisma.barberStaff.findMany({
      where: { barbershopId: barbershop.id },
      orderBy: { name: "asc" },
    });

    let selectedStaff = null;
    const inputNumber = parseInt(messageText.trim(), 10);

    if (!isNaN(inputNumber) && inputNumber >= 1 && inputNumber <= staffMembers.length) {
      selectedStaff = staffMembers[inputNumber - 1];
    } else {
      // Intentar coincidir por nombre
      selectedStaff = staffMembers.find((s) =>
        messageText.toLowerCase().includes(s.name.toLowerCase())
      );
    }

    if (!selectedStaff && staffMembers.length > 0) {
      const optionsText = staffMembers
        .map((s, idx) => `${idx + 1}. ${s.name}`)
        .join("\n");
      await sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: `Por favor, elige el número de la persona que te atendió hoy:\n\n${optionsText}`,
      });
      return;
    }

    // Buscar la última visita del cliente
    const lastVisit = await prisma.barberVisit.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastVisit && selectedStaff) {
      await prisma.barberVisit.update({
        where: { id: lastVisit.id },
        data: { staffId: selectedStaff.id },
      });
    }

    // Transicionar al estado de calificación AWAITING_RATING
    await prisma.barberCustomer.update({
      where: { id: customer.id },
      data: { sessionState: "AWAITING_RATING" },
    });

    await sendWhatsAppMessage({
      instance: barbershop.evolutionInstance,
      apiKey: barbershop.evolutionApiKey,
      to: whatsapp,
      message: `¡Excelente! Por último, del 1 al 5, ¿cómo calificas tu servicio con ${selectedStaff ? selectedStaff.name : "nosotros"} hoy? ⭐`,
    });
    return;
  }

  if (customer.sessionState === "AWAITING_FEEDBACK") {
    // Buscar la última visita del cliente para adjuntar el comentario
    const lastVisit = await prisma.barberVisit.findFirst({
      where: { customerId: customer.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    if (lastVisit) {
      await prisma.barberVisit.update({
        where: { id: lastVisit.id },
        data: { comment: messageText },
      });
    }

    // Resetear sesión del cliente
    await prisma.barberCustomer.update({
      where: { id: customer.id },
      data: { sessionState: "IDLE" },
    });

    const isGym = barbershop.vertical === "GIMNASIO";
    const thanksEmoji = isGym ? "💪" : "✂️";

    await sendWhatsAppMessage({
      instance: barbershop.evolutionInstance,
      apiKey: barbershop.evolutionApiKey,
      to: whatsapp,
      message: `¡Muchas gracias por tus comentarios! 📝 Los tomaremos muy en cuenta para darte siempre la mejor experiencia. ¡Nos vemos pronto! ${thanksEmoji}`,
    });
    return;
  }

  if (customer.sessionState === "AWAITING_RATING") {
    // Extraer rating (primer dígito numérico)
    const ratingMatch = messageText.match(/\d/);
    if (!ratingMatch) {
      await sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: "Por favor, envía un número del 1 al 5 para calificar tu experiencia.",
      });
      return;
    }

    const rating = parseInt(ratingMatch[0], 10);
    if (rating < 1 || rating > 5) {
      await sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: "La calificación debe ser del 1 al 5. Intenta de nuevo.",
      });
      return;
    }

    // Buscar última visita aprobada sin rating
    const lastVisit = await prisma.barberVisit.findFirst({
      where: {
        customerId: customer.id,
        status: "APPROVED",
        rating: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastVisit) {
      await prisma.barberVisit.update({
        where: { id: lastVisit.id },
        data: { rating },
      });
    }

    const isGym = barbershop.vertical === "GIMNASIO";
    const thanksEmoji = isGym ? "💪" : "✂️";

    if (rating === 5) {
      // 5 Estrellas: Enviar de inmediato la invitación a dejar reseña en Google
      await prisma.barberCustomer.update({
        where: { id: customer.id },
        data: { sessionState: "IDLE", firstReviewSent: true },
      });

      // Si existe la URL directa configurada en la barbería, la usamos; si no, el acortador
      const reviewUrl = barbershop.googleMapsUrl || `${process.env.NEXT_PUBLIC_BASE_URL || "http://www.barberosplus.com"}/r/${barbershop.id}`;

      await sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: `¡Nos alegra muchísimo que tu experiencia haya sido de 5 estrellas! ⭐⭐⭐⭐⭐\n\n¿Nos ayudarías un mundo dejando tu opinión pública en Google? Solo toma 10 segundos:\n👉 ${reviewUrl}\n\n¡Gracias por preferirnos! ${thanksEmoji}`,
      });
    } else {
      // 1 a 4 Estrellas: Pedir opinión por escrito para mejorar internamente
      await prisma.barberCustomer.update({
        where: { id: customer.id },
        data: { sessionState: "AWAITING_FEEDBACK" },
      });

      await sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: whatsapp,
        message: "Queremos darte siempre un servicio de 5 estrellas. 💬 ¿Nos podrías contar brevemente qué ocurrió o qué podemos mejorar para tu próxima visita?",
      });
    }
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  
  // Rate limit para Webhook: Max 120 llamadas por minuto por IP (protección contra inundaciones)
  const { checkDbRateLimit } = await import("@/lib/rate-limit");
  const rateLimit = await checkDbRateLimit({
    key: `webhook:wa:${ip}`,
    maxAttempts: 120,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  // Parsear el payload lo más rápido posible
  let payload: any;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("[Webhook WhatsApp] Error parsing JSON:", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // Procesar ANTES de retornar para garantizar que Vercel no mate el proceso
  // Con delay eliminado y DB ops en paralelo, esto toma <500ms
  try {
    if (payload.event === "connection.update") {
      const evolutionInstance = payload.instance;
      const connectionState = payload.data?.state;
      const whatsappConnectedNumber = payload.data?.statusReason || payload.data?.phone || null;

      if (evolutionInstance) {
        let connectionStatus = "DISCONNECTED";
        if (connectionState === "open" || connectionState === "connected") {
          connectionStatus = "CONNECTED";
        } else if (connectionState === "connecting" || connectionState === "qrcode") {
          connectionStatus = "WAITING_QR";
        }

        const barbershop = await prisma.barbershop.findFirst({ where: { evolutionInstance } });
        if (barbershop) {
          await prisma.barbershop.update({
            where: { id: barbershop.id },
            data: {
              connectionStatus,
              whatsappConnected: whatsappConnectedNumber ? String(whatsappConnectedNumber).replace(/\D/g, "") : barbershop.whatsappConnected,
            },
          });
        }
      }
    } else {
      // Mensajes regulares — procesar completo antes de retornar
      await processMessage(payload);
    }
  } catch (err) {
    console.error("[Webhook WhatsApp] Error en procesamiento:", err);
  }

  // Retornar 200 a Evolution API
  return NextResponse.json({ success: true });
}
