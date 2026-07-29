import { prisma } from "@/lib/prisma";
import RegistrationForm from "@/components/public/RegistrationForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTheme } from "@/lib/vertical-theme";

export default async function QRRegistrationPage({
  params,
}: {
  params: Promise<{ barbershopId: string }>;
}) {
  const { barbershopId } = await params;

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { name: true, vertical: true },
  });

  if (!barbershop) {
    notFound();
  }

  const theme = getTheme(barbershop.vertical);
  const { colors, texts } = theme;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
      }}
    >
      {/* Header */}
      <header 
        className="py-6 px-6 border-b flex items-center justify-center backdrop-blur-sm sticky top-0 z-10"
        style={{
          backgroundColor: `${colors.bgPrimary}f2`,
          borderColor: colors.border,
        }}
      >
        <Link
          href="/"
          className="font-display text-xl font-light tracking-widest"
          style={{ color: colors.textPrimary }}
        >
          {texts.brand}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-light tracking-wide mb-2" style={{ color: colors.textPrimary }}>
              Regístrate en <span className="font-medium" style={{ color: colors.accent }}>{barbershop.name}</span>
            </h1>
            <p className="font-sans font-light" style={{ color: colors.textMuted }}>
              {texts.registrationSubtitle}
            </p>
          </div>

          <div 
            className="p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
            }}
          >
            <RegistrationForm
              barbershopId={barbershopId}
              barbershopName={barbershop.name}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
