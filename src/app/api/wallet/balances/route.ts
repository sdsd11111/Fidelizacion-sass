import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await verifySession();
  if (!session?.barbershopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener todas las transacciones aprobadas del negocio
  const transactions = await prisma.walletTransaction.findMany({
    where: {
      barbershopId: session.barbershopId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
  });

  // Agrupar por customerPhone
  const balanceMap = new Map<
    string,
    {
      customerPhone: string;
      customerName: string;
      balance: number;
      lastActivity: Date;
      txCount: number;
    }
  >();

  for (const tx of transactions) {
    const existing = balanceMap.get(tx.customerPhone);
    if (existing) {
      existing.balance += tx.credit; // REDEEM ya viene negativo en el crédito
      existing.txCount += 1;
      if (tx.createdAt > existing.lastActivity) {
        existing.lastActivity = tx.createdAt;
        existing.customerName = tx.customerName; // Actualizar nombre si cambió
      }
    } else {
      balanceMap.set(tx.customerPhone, {
        customerPhone: tx.customerPhone,
        customerName: tx.customerName,
        balance: tx.credit,
        lastActivity: tx.createdAt,
        txCount: 1,
      });
    }
  }

  const balances = Array.from(balanceMap.values());

  return NextResponse.json(balances);
}
