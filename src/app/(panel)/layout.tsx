import { redirect } from "next/navigation";
import { deleteSession } from "@/lib/session";
import { verifySession } from "@/lib/dal";
import { isPremiumBarbershop } from "@/lib/plan-guard";
import { prisma } from "@/lib/prisma";
import PanelNav from "@/components/panel/PanelNav";
import DirectorChatWidget from "@/components/panel/DirectorChatWidget";

async function logout() {
  "use server";
  await deleteSession();
  redirect("/login");
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  const isPremium = await isPremiumBarbershop(session.barbershopId);

  // Obtener la vertical del negocio para theming
  // Primero intentamos desde la sesión (JWT), fallback a DB
  const shop = await prisma.barbershop.findUnique({
    where: { id: session.barbershopId },
    select: {
      vertical: true,
      logoUrl: true,
      brandPrimaryColor: true,
      brandSecondaryColor: true,
      brandAccentColor: true,
    },
  });

  const vertical = shop?.vertical || session.vertical || "BARBERIA";
  const customBranding = {
    brandPrimaryColor: shop?.brandPrimaryColor,
    brandSecondaryColor: shop?.brandSecondaryColor,
    brandAccentColor: shop?.brandAccentColor,
  };

  const { getTheme, themeStyles } = await import("@/lib/vertical-theme");
  const theme = getTheme(vertical, customBranding);
  const styles = themeStyles(vertical, customBranding);

  return (
    // overflow-x-hidden defensivo: garantiza que NINGÚN hijo pueda
    // provocar scroll horizontal en el panel (común en listas de
    // staff, tablas, contenedores con whitespace-nowrap, etc.).
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary,
        ...styles,
      }}
    >
      <PanelNav logoUrl={shop?.logoUrl} logoutAction={logout} isPremium={isPremium} vertical={vertical} brandPrimaryColor={shop?.brandPrimaryColor} />

      {/* Main Content — con padding top para compensar el header fijo */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
          {children}
        </div>
      </main>

      {/* Consultor Director IA 24/7 Chatbot (Exclusivo para Premium) */}
      {isPremium && <DirectorChatWidget />}
    </div>
  );
}
