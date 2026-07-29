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
  const body = await req.json().catch(() => ({}));
  const { adminNote } = body;

  const tx = await prisma.walletTransaction.findUnique({
    where: { id },
  });

  if (!tx || tx.barbershopId !== session.barbershopId) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  const updatedTx = await prisma.walletTransaction.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNote: adminNote || null,
      processedAt: new Date(),
    },
  });

  return NextResponse.json(updatedTx);
}
