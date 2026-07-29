// filepath: src/components/redesign/SectionTabs.tsx
"use client";

import { type ReactNode } from "react";

export interface SectionTab {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Valor opcional que se muestra como número sobre el tab. */
  badge?: string | number;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  activeTab: string;
  onChange: (id: string) => void;
  /** Variante visual: "pill" (segmented control como en la referencia fitness). */
  variant?: "pill" | "underline";
  className?: string;
  vertical?: string;
}

export default function SectionTabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  className = "",
  vertical = "BARBERIA",
}: SectionTabsProps) {
  const isGym = vertical === "GIMNASIO";

  if (variant === "underline") {
    return (
      <div className={`flex gap-1 overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                "relative px-4 py-2 font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap transition-colors",
                isActive
                  ? isGym ? "text-[#e2e8f0]" : "text-[#f3ece1]"
                  : isGym ? "text-[#475569] hover:text-[#94a3b8]" : "text-[#5c554c] hover:text-[#a89e90]",
              ].join(" ")}
            >
              {tab.icon && <span className="mr-1.5 align-middle">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={[
                    "ml-2 px-1.5 py-0.5 rounded-full text-[9px]",
                    isActive
                      ? isGym ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#d97644]/15 text-[#d97644]"
                      : isGym ? "bg-[#1e293b] text-[#94a3b8]" : "bg-[#2a2520] text-[#a89e90]",
                  ].join(" ")}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className={`absolute left-0 right-0 -bottom-px h-0.5 ${isGym ? "bg-[#3b82f6]" : "bg-[#d97644]"}`} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: pill / segmented control (estilo referencia fitness)
  return (
    <div
      className={[
        "flex items-center gap-1 p-1 rounded-full shrink-0",
        isGym
          ? "bg-[#0f172a]/80 border border-[#1e293b]"
          : "bg-[#1a1614]/70 border border-[#3a2f25]/80",
        "backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        className,
      ].join(" ")}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={[
              "relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full shrink-0 snap-start",
              "font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap",
              "transition-all duration-200 ease-out",
              "active:scale-95",
              isActive
                ? isGym
                  ? "bg-gradient-to-b from-[#60a5fa] to-[#3b82f6] text-[#070b14] shadow-[0_4px_12px_-2px_rgba(59,130,246,0.55)]"
                  : "bg-gradient-to-b from-[#e89263] to-[#d97644] text-[#1a0f08] shadow-[0_4px_12px_-2px_rgba(217,118,68,0.55)]"
                : isGym
                  ? "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#e2e8f0]/5"
                  : "text-[#a89e90] hover:text-[#f3ece1] hover:bg-[#f3ece1]/5",
            ].join(" ")}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={[
                  "ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                  isActive
                    ? isGym
                      ? "bg-[#070b14]/25 text-[#070b14]"
                      : "bg-[#1a0f08]/25 text-[#1a0f08]"
                    : isGym
                      ? "bg-[#1e293b] text-[#94a3b8]"
                      : "bg-[#3a2f25] text-[#a89e90]",
                ].join(" ")}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}