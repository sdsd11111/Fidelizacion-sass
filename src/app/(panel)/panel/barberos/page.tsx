// filepath: src/app/(panel)/panel/barberos/page.tsx
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import PanelHero from "@/components/redesign/PanelHero";
import MetricTile from "@/components/redesign/MetricTile";
import BarberosView from "@/components/panel/BarberosView";

export default async function BarberosPage() {
  const session = await verifySession();
  const barbershopId = session.barbershopId;

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { whatsappNumber: true, currentBoxCode: true, name: true, vertical: true },
  });

  const vertical = barbershop?.vertical ?? "BARBERIA";
  const isGym = vertical === "GIMNASIO";

  const staff = await prisma.barberStaff.findMany({
    where: { barbershopId },
    orderBy: { name: "asc" },
  });

  const customers = await prisma.barberCustomer.findMany({
    where: { barbershopId },
    select: { id: true, name: true, whatsapp: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const customerIds = customers.map((c) => c.id);

  const visits = await prisma.barberVisit.findMany({
    where: {
      customerId: { in: customerIds },
      status: "APPROVED",
      rating: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  const allRatings = visits.filter((v) => v.rating !== null);
  const generalAvg =
    allRatings.length > 0
      ? allRatings.reduce((sum, v) => sum + (v.rating ?? 0), 0) / allRatings.length
      : 0;
  const generalCount = allRatings.length;

  const generalDistribution = [0, 0, 0, 0, 0];
  allRatings.forEach((v) => {
    if (v.rating && v.rating >= 1 && v.rating <= 5) {
      generalDistribution[v.rating - 1]++;
    }
  });

  const staffStats = staff.map((member) => {
    const staffVisits = visits.filter((v) => v.staffId === member.id && v.rating !== null);
    const avg =
      staffVisits.length > 0
        ? staffVisits.reduce((sum, v) => sum + (v.rating ?? 0), 0) / staffVisits.length
        : 0;

    const distribution = [0, 0, 0, 0, 0];
    staffVisits.forEach((v) => {
      if (v.rating && v.rating >= 1 && v.rating <= 5) {
        distribution[v.rating - 1]++;
      }
    });

    const reviews = staffVisits.map((v) => {
      const cust = v.customerId ? customerMap.get(v.customerId) : undefined;
      return {
        id: v.id,
        rating: v.rating!,
        comment: v.comment || null,
        createdAt: v.createdAt.toISOString(),
        customerName: cust?.name || "Cliente Registrado",
        customerWhatsapp: cust?.whatsapp || "",
      };
    });

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      photoUrl: member.photoUrl || null,
      avgRating: avg,
      totalRatings: staffVisits.length,
      distribution,
      reviews,
    };
  });

  const unassignedVisits = visits.filter((v) => !v.staffId && v.rating !== null);
  const unassignedCount = unassignedVisits.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32">
      {/* HERO */}
      <PanelHero
        imageUrl={isGym ? "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&q=80" : "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&q=80"}
        imagePosition="center 30%"
        accentColor={isGym ? "#3b82f6" : "#d97644"}
        eyebrow="Rendimiento por Persona"
        badge={
          <span className={`${isGym ? "bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30" : "bg-[#e8a33d]/15 text-[#e8a33d] border-[#e8a33d]/30"} border px-2 py-0.5 text-[9px] font-mono rounded-full uppercase tracking-[0.2em]`}>
            ★ {generalAvg.toFixed(1)} Promedio
          </span>
        }
        title={isGym ? "Entrenadores" : "Barberos"}
        subtitle={isGym ? "Mide el desempeño de cada entrenador: calificaciones, distribución de estrellas y reseñas reales de tus miembros." : "Mide el desempeño de cada profesional: calificaciones, distribución de estrellas y reseñas reales de tus clientes."}
        minHeight={300}
        vertical={vertical}
      />

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Calificación General"
          value={generalAvg > 0 ? generalAvg.toFixed(1) : "—"}
          caption="Promedio de todas las reseñas"
          icon="★"
          accent="amber"
          vertical={vertical}
        />
        <MetricTile
          label="Total Reseñas"
          value={generalCount}
          caption="Votos acumulados"
          icon="✎"
          accent="orange"
          vertical={vertical}
        />
        <MetricTile
          label={isGym ? "Entrenadores" : "Profesionales"}
          value={staffStats.length}
          caption={unassignedCount > 0 ? `+${unassignedCount} sin asignar` : "Activos"}
          icon="✦"
          accent="green"
          vertical={vertical}
        />
      </div>

      <BarberosView
        generalAvg={generalAvg}
        generalCount={generalCount}
        generalDistribution={generalDistribution}
        staffStats={staffStats}
        unassignedCount={unassignedCount}
        whatsappNumber={barbershop?.whatsappNumber || ""}
        currentBoxCode={barbershop?.currentBoxCode || ""}
        vertical={vertical}
      />
    </div>
  );
}