import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution";

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session?.barbershopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { customerPhone, customerName, amount, note } = body;

  const redeemAmount = Number(amount);
  if (!customerPhone || isNaN(redeemAmount) || redeemAmount <= 0) {
    return NextResponse.json({ error: "Datos de canje inválidos" }, { status: 400 });
  }

  // 1. Obtener la barbería/gimnasio
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: session.barbershopId },
    select: { name: true, evolutionInstance: true, evolutionApiKey: true },
  });

  if (!barbershop) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  // 2. Calcular saldo actual del cliente para verificar que tenga suficiente
  const approvedTxs = await prisma.walletTransaction.findMany({
    where: {
      barbershopId: session.barbershopId,
      customerPhone,
      status: "APPROVED",
    },
  });

  const currentBalance = approvedTxs.reduce((sum: number, tx: { credit: number }) => sum + tx.credit, 0);

  if (redeemAmount > currentBalance) {
    return NextResponse.json(
      { error: `Saldo insuficiente. El cliente solo dispone de $${currentBalance.toFixed(2)}.` },
      { status: 400 }
    );
  }

  // 3. Crear transacción de Canje (REDEEM) con crédito negativo
  const newBalance = currentBalance - redeemAmount;
  const redeemTx = await prisma.walletTransaction.create({
    data: {
      barbershopId: session.barbershopId,
      customerPhone,
      customerName: customerName || customerPhone,
      type: "REDEEM",
      status: "APPROVED",
      amount: redeemAmount,
      credit: -redeemAmount,
      adminNote: note || "Canje registrado en caja",
      processedAt: new Date(),
    },
  });

  // 4. Enviar notificación WhatsApp automática al cliente
  try {
    const message = `🎉 *¡Canje Exitoso en ${barbershop.name}!*\n\nSe han descontado *$${redeemAmount.toFixed(2)}* de tu Wallet.\n\n💰 *Tu saldo restante es:* $${newBalance.toFixed(2)}\n\n¡Gracias por ser parte de ${barbershop.name}! 💪`;

    await sendWhatsAppMessage({
      instance: barbershop.evolutionInstance,
      apiKey: barbershop.evolutionApiKey,
      to: customerPhone,
      message,
    });
  } catch (err) {
    console.error("[Wallet Redeem] Error enviando mensaje WhatsApp de canje:", err);
  }

  return NextResponse.json({
    success: true,
    redeemTx,
    newBalance,
  });
}
