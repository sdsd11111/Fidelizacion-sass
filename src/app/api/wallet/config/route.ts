import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await verifySession();
  if (!session?.barbershopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const config = await prisma.walletConfig.findUnique({
    where: { barbershopId: session.barbershopId },
  });

  return NextResponse.json(config || { plans: [] });
}

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session?.barbershopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { plans } = body;

  const config = await prisma.walletConfig.upsert({
    where: { barbershopId: session.barbershopId },
    create: {
      barbershopId: session.barbershopId,
      plans: plans || [],
    },
    update: {
      plans: plans || [],
    },
  });

  return NextResponse.json(config);
}
