// filepath: src/components/redesign/TabsCarousel.tsx
"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

interface TabsCarouselProps {
  children: ReactNode;
  vertical?: string;
}

/**
 * Wrapper con scroll horizontal + indicador visual "desliza →".
 *
 * Comportamiento:
 * - Móvil (< md): scroll horizontal con snap. Muestra una flecha pulsante
 *   naranja + un gradiente negro en el borde derecho mientras hay contenido
 *   oculto. La flecha desaparece automáticamente cuando el usuario
 *   ha scrolleado o cuando todos los tabs caben.
 * - Desktop (≥ md): los tabs se alinean a la izquierda sin flecha.
 */
export default function TabsCarousel({ children, vertical = "BARBERIA" }: TabsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);
  const [canScroll, setCanScroll] = useState(false);
  const isGym = vertical === "GIMNASIO";

  // Detecta si hay overflow horizontal y si todavía no se ha scrolleado
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 4;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setCanScroll(hasOverflow);
      setShowHint(hasOverflow && el.scrollLeft < 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    // Ocultar automáticamente después de 5s aunque no haya scroll
    const timer = window.setTimeout(() => setShowHint(false), 6000);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const handleArrowClick = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Avanza aproximadamente el ancho visible
    el.scrollBy({ left: el.clientWidth * 0.7, behavior: "smooth" });
  };

  // El componente recibe un solo hijo (el SectionTabs). Lo clonamos sin
  // modificarlo para mantener el contrato.
  const child = Children.only(children);

  return (
    <div className="relative">
      {/* CONTENEDOR SCROLLABLE */}
      <div
        ref={scrollRef}
        className={[
          // En móvil: scroll horizontal con snap.
          // En md+: los 4 tabs caben, justify-start los alinea a la izquierda.
          "flex md:justify-start",
          "overflow-x-auto snap-x snap-mandatory md:snap-none",
          "scrollbar-thin",
        ].join(" ")}
        style={{ scrollbarWidth: "thin" }}
      >
        {child}
      </div>

      {/* GRADIENTE NEGRO EN BORDE DERECHO — solo móvil y solo si hay overflow */}
      {canScroll && (
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute top-0 right-0 bottom-0 w-12",
            isGym
              ? "bg-gradient-to-l from-[#050a18] via-[#050a18]/70 to-transparent"
              : "bg-gradient-to-l from-[#0a0807] via-[#0a0807]/70 to-transparent",
            "md:hidden",
            // Se desvanece cuando el usuario ya scrolleó al final
            "transition-opacity duration-300",
          ].join(" ")}
          style={{ opacity: showHint ? 1 : 0 }}
        />
      )}

      {/* FLECHA INDICADORA — solo móvil, solo si hay overflow, solo si no scrolleó */}
      {canScroll && showHint && (
        <button
          type="button"
          onClick={handleArrowClick}
          aria-label="Desliza para ver más pestañas"
          className={[
            "md:hidden absolute top-1/2 -translate-y-1/2 right-1 z-10",
            "flex items-center justify-center",
            "w-8 h-8 rounded-full",
            isGym
              ? "bg-gradient-to-b from-[#60a5fa] to-[#3b82f6]"
              : "bg-gradient-to-b from-[#e89263] to-[#d97644]",
            isGym ? "text-[#050a18]" : "text-[#1a0f08]",
            isGym
              ? "shadow-[0_4px_12px_rgba(59,130,246,0.55)]"
              : "shadow-[0_4px_12px_rgba(217,118,68,0.55)]",
            // Animación pulsante suave
            "animate-[tabs-hint_1.6s_ease-in-out_infinite]",
          ].join(" ")}
        >
          {/* Chevron doble apuntando a la derecha */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}
    </div>
  );
}