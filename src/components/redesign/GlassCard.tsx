// filepath: src/components/redesign/GlassCard.tsx
"use client";

import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Padding interno. Default "md". */
  padding?: "sm" | "md" | "lg";
  /** Borde más marcado para cards sobre imágenes hero. */
  elevated?: boolean;
  vertical?: string;
}

export default function GlassCard({
  children,
  className = "",
  padding = "md",
  elevated = false,
  vertical = "BARBERIA",
}: GlassCardProps) {
  const padMap = { sm: "p-3 sm:p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };
  const isGym = vertical === "GIMNASIO";

  return (
    <div
      className={[
        "relative rounded-2xl",
        isGym
          ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl"
          : "bg-[#1a1614]/70 border border-[#3a2f25]/80 backdrop-blur-md rounded-2xl",
        isGym ? "shadow-[0_8px_30px_rgba(15,32,64,0.6)]" : "shadow-[0_8px_30px_rgba(0,0,0,0.55)]",
        padMap[padding],
        elevated ? (isGym ? "ring-1 ring-[#3b82f6]/20" : "ring-1 ring-[#d97644]/15") : "",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isGym ? "via-[#e2e8f0]/15" : "via-[#f3ece1]/15"} to-transparent`}
      />
      {children}
    </div>
  );
}
