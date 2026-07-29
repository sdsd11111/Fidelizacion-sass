import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import ConfigForm from "@/components/panel/ConfigForm";
import { redirect } from "next/navigation";

export default async function ConfiguracionPage() {
  const session = await verifySession();
  const barbershopId = session.barbershopId;

  if (!barbershopId) {
    redirect("/login");
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: {
      riskThresholdNormal: true,
      riskThresholdAt: true,
      loyaltyMode: true,
      visitDurationMin: true,
      businessInfo: true,
      requiredCuts: true,
      vertical: true,
    },
  });

  if (!barbershop) {
    redirect("/login");
  }

  const isPremium = await isPremiumBarbershop(barbershopId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-light tracking-widest text-[#f3ece1] uppercase">
          Configuración
        </h1>
        <p className="text-[#a89e90] mt-2 font-sans font-light">
          Ajustes del motor y operativas {barbershop.vertical === "GIMNASIO" ? "del gimnasio" : "de la barbería"}.
        </p>
      </div>

      <ConfigForm initialData={barbershop} isPremium={isPremium} />
    </div>
  );
}
