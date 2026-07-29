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
  }

  const updatedTx = await prisma.walletTransaction.update({
    where: { id },
    data: {
      status: "APPROVED",
      amount: finalAmount,
      percentage: finalPercentage,
      credit: finalCredit,
      productName: finalProductName,
      adminNote: adminNote || null,
      processedAt: new Date(),
    },
  });

  return NextResponse.json(updatedTx);
}
