"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getTheme } from "@/lib/vertical-theme";

export default function PanelNav({
  logoutAction,
  isPremium = false,
  vertical = "BARBERIA",
}: {
  logoutAction: () => Promise<void>;
  isPremium?: boolean;
  vertical?: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const theme = getTheme(vertical);
  const { colors, texts } = theme;

  const navLinks = [
    { href: "/panel", label: "Dashboard", exact: true },
    { href: "/panel/clientes", label: "Clientes" },
    { href: "/panel/barberos", label: texts.navStaff },
    ...(vertical === "GIMNASIO" ? [{ href: "/panel/wallet", label: "Wallet" }] : []),
    { href: "/panel/whatsapp", label: "Configuración" },
  ];

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 h-16 border-b flex items-center px-4 sm:px-6 justify-between backdrop-blur-sm"
        style={{
          backgroundColor: `${colors.bgPrimary}f2`,
          borderColor: colors.border,
        }}
      >
        {/* Logo */}
        <Link
          href="/panel"
          className="font-display text-xl font-light tracking-widest transition-colors"
          style={{ color: colors.textPrimary }}
          onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = colors.textPrimary; }}
        >
          {texts.brand}
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="font-mono text-xs tracking-[0.2em] uppercase transition-colors"
                  style={{
                    color: isActive ? colors.accent : colors.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = colors.textMuted;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Logout + hamburger */}
        <div className="flex items-center gap-4">
          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="font-mono text-xs tracking-[0.2em] uppercase transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; }}
            >
              Salir
            </button>
          </form>

          {/* Hamburger mobile */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <span
              className={`block h-[1.5px] w-6 transition-all duration-300 origin-center ${
                menuOpen ? "rotate-45 translate-y-[6.5px]" : ""
              }`}
              style={{ backgroundColor: colors.textMuted }}
            />
            <span
              className={`block h-[1.5px] w-6 transition-all duration-300 ${
                menuOpen ? "opacity-0 scale-x-0" : ""
              }`}
              style={{ backgroundColor: colors.textMuted }}
            />
            <span
              className={`block h-[1.5px] w-6 transition-all duration-300 origin-center ${
                menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
              }`}
              style={{ backgroundColor: colors.textMuted }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bottom-0 z-40 transition-all duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: colors.bgPrimary }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-10 pb-16">
          <ul className="flex flex-col items-center gap-8">
            {navLinks.map(({ href, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-display text-3xl font-light tracking-widest transition-colors"
                    style={{
                      color: isActive ? colors.accent : colors.textPrimary,
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <form action={logoutAction}>
            <button
              type="submit"
              className="font-mono text-sm tracking-[0.3em] uppercase transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; }}
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
