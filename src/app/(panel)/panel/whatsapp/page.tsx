import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import { redirect } from "next/navigation";
import WhatsAppContent from "@/components/panel/WhatsAppContent";
import ConfigTabs from "@/components/panel/ConfigTabs";
import WalletConfigSection from "@/components/panel/WalletConfigSection";

export default async function WhatsAppPage() {
  const session = await verifySession();
  const barbershopId = session.barbershopId;

  if (!barbershopId) {
    redirect("/login");
  }

  const isPremium = await isPremiumBarbershop(barbershopId);

  // Obtener vertical para theming, whatsappNumber, currentBoxCode y name
  const shopBase = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { vertical: true, whatsappNumber: true, currentBoxCode: true, name: true },
  });
  const vertical = shopBase?.vertical || "BARBERIA";
  const isGym = vertical === "GIMNASIO";

  // PREMIUM: cargar datos de configuración para las tabs
  if (isPremium) {
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

    return (
      <div className="space-y-6 overflow-x-hidden">
        <header>
          <p className="font-mono text-xs tracking-[0.3em] uppercase mb-2" style={{ color: isGym ? "#64748b" : "#5c554c" }}>
            {isGym ? "Ajustes del Gimnasio" : "Ajustes de la Barbería"}
          </p>
          <h2 className="font-display text-5xl font-light" style={{ color: isGym ? "#ffffff" : "#f3ece1" }}>
            Configuración
          </h2>
        </header>

        <ConfigTabs configData={barbershop} />
        {isGym && (
          <WalletConfigSection
            whatsappNumber={shopBase?.whatsappNumber || ""}
            currentBoxCode={shopBase?.currentBoxCode || ""}
            shopName={shopBase?.name || "Gimnasio"}
            vertical={vertical}
          />
        )}
      </div>
    );
  }

  // PRO: solo WhatsApp + StaffManager + WalletConfigSection (si es Gym)
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-[0.3em] uppercase mb-2" style={{ color: isGym ? "#64748b" : "#5c554c" }}>
          {isGym ? "Ajustes del Gimnasio" : "Ajustes de la Barbería"}
        </p>
        <h2 className="font-display text-5xl font-light" style={{ color: isGym ? "#ffffff" : "#f3ece1" }}>
          Configuración
        </h2>
      </header>

      <WhatsAppContent vertical={vertical} />
      {isGym && (
        <WalletConfigSection
          whatsappNumber={shopBase?.whatsappNumber || ""}
          currentBoxCode={shopBase?.currentBoxCode || ""}
          shopName={shopBase?.name || "Gimnasio"}
          vertical={vertical}
        />
      )}
    </div>
  );
}
