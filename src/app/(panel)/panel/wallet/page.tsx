import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WalletClientPage from "./WalletClientPage";

export default async function WalletPage() {
  const session = await verifySession();
  const barbershopId = session.barbershopId;

  if (!barbershopId) {
    redirect("/login");
  }

  const shop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { vertical: true, name: true },
  });

  // Solo disponible para GIMNASIO
  if (shop?.vertical !== "GIMNASIO") {
    redirect("/panel");
  }

  return <WalletClientPage vertical={shop.vertical} shopName={shop.name} />;
}
