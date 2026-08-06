import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import { redirect } from "next/navigation";
import WhatsAppContent from "@/components/panel/WhatsAppContent";
import ConfigTabs from "@/components/panel/ConfigTabs";
import WalletConfigSection from "@/components/panel/WalletConfigSection";
import LogoBrandingSection from "@/components/panel/LogoBrandingSection";

export default async function WhatsAppPage() {
  const session = await verifySession();
  const barbershopId = session.barbershopId;

  if (!barbershopId) {
    redirect("/login");
  }

  const isPremium = await isPremiumBarbershop(barbershopId);

  // Obtener datos del negocio para theming y branding
  const shopBase = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: {
      vertical: true,
      whatsappNumber: true,
      currentBoxCode: true,
      name: true,
      logoUrl: true,
      brandPrimaryColor: true,
      brandSecondaryColor: true,
      brandAccentColor: true,
    },
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
        logoUrl: true,
        brandPrimaryColor: true,
        brandSecondaryColor: true,
        brandAccentColor: true,
      },
    });

    if (!barbershop) {
      redirect("/login");
    }

    return (
      <div className="space-y-8 overflow-x-hidden">
        <header>
          <p className="font-mono text-xs tracking-[0.3em] uppercase mb-2" style={{ color: isGym ? "#64748b" : "#5c554c" }}>
            {isGym ? "Ajustes del Gimnasio" : "Ajustes de la Barbería"}
          </p>
          <h2 className="font-display text-5xl font-light" style={{ color: isGym ? "#ffffff" : "#f3ece1" }}>
            Configuración
          </h2>
        </header>

        {/* Sección de Subida de Logo & Branding */}
        <LogoBrandingSection
          initialLogoUrl={shopBase?.logoUrl}
          initialPrimaryColor={shopBase?.brandPrimaryColor}
          initialSecondaryColor={shopBase?.brandSecondaryColor}
          initialAccentColor={shopBase?.brandAccentColor}
          vertical={vertical}
        />

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

  // PRO: solo WhatsApp + StaffManager + LogoBranding + WalletConfigSection (si es Gym)
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

      {/* Sección de Subida de Logo & Branding */}
      <LogoBrandingSection
        initialLogoUrl={shopBase?.logoUrl}
        initialPrimaryColor={shopBase?.brandPrimaryColor}
        initialSecondaryColor={shopBase?.brandSecondaryColor}
        initialAccentColor={shopBase?.brandAccentColor}
        vertical={vertical}
      />

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
