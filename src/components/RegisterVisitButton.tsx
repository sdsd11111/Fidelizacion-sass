"use client";

import { useState } from "react";
import RegisterVisitModal from "@/components/RegisterVisitModal";
import { getTheme } from "@/lib/vertical-theme";

interface RegisterVisitButtonProps {
  barbershopId: string;
  vertical?: string;
}

export default function RegisterVisitButton({ barbershopId, vertical = "BARBERIA" }: RegisterVisitButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = getTheme(vertical);
  const { colors, texts } = theme;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="font-mono text-xs tracking-[0.2em] uppercase font-bold px-6 py-3 transition-colors shadow-lg"
        style={{
          backgroundColor: colors.accent,
          color: colors.bgPrimary,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
      >
        {vertical === "GIMNASIO" ? "Registrar Asistencia" : "Registrar Corte"}
      </button>

      <RegisterVisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        barbershopId={barbershopId}
      />
    </>
  );
}
