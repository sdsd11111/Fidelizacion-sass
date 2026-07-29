import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session?.barbershopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { amount, percentage, productName, adminNote } = body;

  const tx = await prisma.walletTransaction.findUnique({
    where: { id },
  });

  if (!tx || tx.barbershopId !== session.barbershopId) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  let finalAmount = tx.amount;
  let finalPercentage = tx.percentage;
  let finalCredit = tx.credit;
  let finalProductName = tx.productName;
  let finalPlanName = tx.planName;

  if (tx.type === "TIENDA") {
    finalAmount = Number(amount) || 0;
    finalPercentage = Number(percentage) || 0;
    finalCredit = (finalAmount * finalPercentage) / 100;
    finalProductName = productName || tx.productName;
  } else if (tx.type === "MENSUALIDAD") {
    // Si la mensualidad ya venía con su crédito calculado en el bot
    if (amount !== undefined && percentage !== undefined) {
      finalAmount = Number(amount);
      finalPercentage = Number(percentage);
      finalCredit = (finalAmount * finalPercentage) / 100;
    }
    if (body.planName) {
      finalPlanName = body.planName;
    }
  }

  const updatedTx = await prisma.walletTransaction.update({
    where: { id },
    data: {
      status: "APPROVED",
      amount: finalAmount,
      percentage: finalPercentage,
      credit: finalCredit,
      productName: finalProductName,
      planName: finalPlanName,
      adminNote: adminNote || null,
      processedAt: new Date(),
    },
  });

  // Calcular el saldo total acumulado por el cliente
  const allApprovedTxs = await prisma.walletTransaction.findMany({
    where: {
      barbershopId: session.barbershopId,
      customerPhone: tx.customerPhone,
      status: "APPROVED",
    },
  });

  const totalBalance = allApprovedTxs.reduce((sum, item) => sum + item.credit, 0);

  // Obtener datos del gimnasio para enviar mensaje por WhatsApp
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: session.barbershopId },
    select: { evolutionInstance: true, evolutionApiKey: true, name: true },
  });

  if (barbershop && barbershop.evolutionInstance) {
    const { sendWhatsAppMessage } = await import("@/lib/evolution");

    let waMessage = "";
    if (tx.type === "TIENDA") {
      const prodText = finalProductName ? ` por "${finalProductName}"` : "";
      waMessage = `🎉 *¡Compra Aprobada en ${barbershop.name}!*\n\nHola ${tx.customerName}, tu compra${prodText} ($${finalAmount.toFixed(
        2
      )}) ha sido verificada.\n\n✨ *Monto acreditado:* +$${finalCredit.toFixed(2)} (${finalPercentage}%)\n💰 *Tu Saldo Total en Wallet:* $${totalBalance.toFixed(
        2
      )}\n\n¡Gracias por tu compra! 💪`;
    } else if (tx.type === "MENSUALIDAD") {
      const planText = finalPlanName ? ` por el plan "${finalPlanName}"` : "";
      waMessage = `💪 *¡Comisión por Referido Acreditada en ${barbershop.name}!*\n\nHola ${tx.customerName}, tu reporte de referido${planText} ha sido aprobado por el administrador.\n\n✨ *Comisión ganada:* +$${finalCredit.toFixed(
        2
      )} (${finalPercentage}%)\n💰 *Tu Saldo Total en Wallet:* $${totalBalance.toFixed(
        2
      )}\n\n¡Sigue refiriendo a más amigos para acumular más saldo! 🔥`;
    }

    if (waMessage) {
      sendWhatsAppMessage({
        instance: barbershop.evolutionInstance,
        apiKey: barbershop.evolutionApiKey,
        to: tx.customerPhone,
        message: waMessage,
      }).catch((e) => console.error("[Wallet Approval WA Error]:", e));
    }
  }

  return NextResponse.json(updatedTx);
}
