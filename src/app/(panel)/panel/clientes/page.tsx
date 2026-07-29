// filepath: src/app/(panel)/panel/clientes/page.tsx
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import PanelHero from "@/components/redesign/PanelHero";
import MetricTile from "@/components/redesign/MetricTile";
import ClientesTabs from "@/components/panel/ClientesTabs";
import ExportDataButton from "@/components/panel/ExportDataButton";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await verifySession();
  const barbershopId = session.barbershopId;
  const isPremium = await isPremiumBarbershop(barbershopId);
  const { tab } = await searchParams;

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
  });

  // Obtener todos los PERFILES con datos completos
  const profiles = await prisma.customerProfile.findMany({
    where: { barbershopId, isActive: true },
    include: {
      customer: true, // Para obtener el whatsapp y cutsCount de la cuenta
    },
    orderBy: { createdAt: "desc" },
  });

  const profileIds = profiles.map((p) => p.id);

  // Obtener el equipo de la barbería para mapear los nombres de los profesionales
  const staffList = await prisma.barberStaff.findMany({
    where: { barbershopId },
    select: { id: true, name: true },
  });
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]));

  // Obtener todas las visitas aprobadas de la barbería
  const allVisits = await prisma.barberVisit.findMany({
    where: {
      barbershopId,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Enriquecer cada PERFIL con sus estadísticas e historial detallado de visitas
  const enrichedProfiles = profiles.map((profile) => {
    const visits = allVisits.filter((v) => v.profileId === profile.id);
    const approvedVisits = visits.filter((v) => v.status === "APPROVED");
    const ratedVisits = approvedVisits.filter((v) => v.rating !== null);
    const avgRating =
      ratedVisits.length > 0
        ? ratedVisits.reduce((acc, v) => acc + (v.rating ?? 0), 0) / ratedVisits.length
        : null;

    const lastVisit = approvedVisits[0] ?? null;
    const isNewThisMonth =
      lastVisit !== null && lastVisit.createdAt >= startOfMonth;

    // Loyalty logic
    const activeCutsCount =
      barbershop?.loyaltyMode === "BY_ACCOUNT"
        ? profile.customer.cutsCount
        : profile.cutsCount;
    const isRecurrent = activeCutsCount >= 2;

    const history = visits.map((v) => ({
      id: v.id,
      createdAt: v.createdAt.toISOString(),
      status: v.status,
      rating: v.rating,
      comment: v.comment,
      staffName: v.staffId ? staffMap.get(v.staffId) || "Profesional no encontrado" : null,
    }));

    return {
      id: profile.id,
      whatsapp: profile.customer.whatsapp,
      name: profile.name,
      customerName: profile.customer.name,
      cutsCount: activeCutsCount,
      avgRating,
      sessionState: profile.customer.sessionState,
      lastVisitAt: lastVisit?.createdAt ?? null,
      isNewThisMonth,
      isRecurrent,
      totalVisits: approvedVisits.length,
      history,
    };
  });

  // Agrupar todas las visitas de Consumidor Final (CF) en una única entrada consolidada
  const cfVisits = allVisits.filter((v) => !v.customerId || !v.profileId);
  if (cfVisits.length > 0) {
    const lastCfVisit = cfVisits[0];
    enrichedProfiles.unshift({
      id: "cf-profile-synthetic",
      whatsapp: "CF",
      name: "Consumidor Final (CF)",
      customerName: "Consumidor Final (CF)",
      cutsCount: cfVisits.length,
      avgRating: null,
      sessionState: "CF",
      lastVisitAt: lastCfVisit.createdAt,
      isNewThisMonth: false,
      isRecurrent: false,
      totalVisits: cfVisits.length,
      history: cfVisits.map((v) => ({
        id: v.id,
        createdAt: v.createdAt.toISOString(),
        status: v.status,
        rating: v.rating,
        comment: v.comment,
        staffName: v.staffId ? staffMap.get(v.staffId) || "Sin asignar" : "Sin asignar",
      })),
    });
  }

  const requiredCuts = barbershop?.requiredCuts ?? 5;

  const totalProfiles = enrichedProfiles.length;
  const recurrentProfiles = enrichedProfiles.filter((p) => p.isRecurrent).length;
  const newThisMonth = enrichedProfiles.filter((p) => p.isNewThisMonth).length;

  const vertical = barbershop?.vertical ?? "BARBERIA";
  const isGym = vertical === "GIMNASIO";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* HERO */}
      <PanelHero
        imageUrl={isGym ? "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80" : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80"}
        imagePosition="center 35%"
        accentColor={isGym ? "#3b82f6" : "#d97644"}
        eyebrow="Tu Base Viva"
        badge={
          <span className="bg-[#f3ece1]/10 text-[#f3ece1] border border-[#f3ece1]/20 px-2 py-0.5 text-[9px] font-mono rounded-full uppercase tracking-[0.2em]">
            {totalProfiles} Perfiles
          </span>
        }
        title="Clientes"
        subtitle={isGym ? "Cada perfil cuenta una historia: desde el cliente recurrente hasta tus miembros VIP. Gestiona, filtra y entiéndelos." : "Cada perfil cuenta una historia: desde el Consumidor Final hasta tus clientes VIP. Gestiona, filtra y entiéndelos."}
        action={
          isPremium && <ExportDataButton variant="compact" />
        }
        minHeight={300}
        vertical={vertical}
      />

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Total Perfiles"
          value={totalProfiles}
          caption="Clientes en tu base"
          icon="◐"
          accent="orange"
          vertical={vertical}
        />
        <MetricTile
          label="Recurrentes"
          value={recurrentProfiles}
          caption={isGym ? "2+ asistencias realizadas" : "2+ cortes realizados"}
          icon="↻"
          accent="amber"
          vertical={vertical}
        />
        <MetricTile
          label="Nuevos del Mes"
          value={newThisMonth}
          caption={isGym ? "Primera asistencia este mes" : "Primer corte este mes"}
          icon="✦"
          accent="green"
          vertical={vertical}
        />
      </div>

      {/* TABS DE CLIENTES */}
      <ClientesTabs
        customers={enrichedProfiles}
        initialTab={tab ?? "todos"}
        requiredCuts={requiredCuts}
        loyaltyMode={barbershop?.loyaltyMode ?? "BY_PROFILE"}
        vertical={vertical}
      />
    </div>
  );
}