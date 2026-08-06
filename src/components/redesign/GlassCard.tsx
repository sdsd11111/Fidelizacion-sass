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
      style={{
        backgroundColor: "var(--theme-card, #18181b)",
        borderColor: "var(--theme-border, #27272a)",
      }}
      className={[
        "relative rounded-2xl border backdrop-blur-xl shadow-lg",
        padMap[padding],
        elevated ? "ring-1 ring-[var(--brand-primary)]/20" : "",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      {children}
    </div>
  );
}
