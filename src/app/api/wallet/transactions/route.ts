import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await verifySession();
  if (!session?.barbershopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED
  const type = searchParams.get("type"); // TIENDA | MENSUALIDAD | REDEEM
  const customerPhone = searchParams.get("customerPhone");

  const where: any = {
    barbershopId: session.barbershopId,
  };

  if (status) where.status = status;
  if (type) where.type = type;
  if (customerPhone) where.customerPhone = customerPhone;

  const transactions = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(transactions);
}
