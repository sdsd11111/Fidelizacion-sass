"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTheme, type Vertical } from "@/lib/vertical-theme";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "checking">("checking");
  const [message, setMessage] = useState("");
  const [vertical, setVertical] = useState<Vertical>("GIMNASIO");
  const router = useRouter();

  const theme = getTheme(vertical);
  const { colors, texts } = theme;

  // Verificar si ya hay sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/barbershop/status");
        if (res.ok) {
          router.replace("/panel");
          return;
        }
      } catch {
        // No hay sesión, mostrar formulario de login
      }
      setStatus("idle");
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setStatus("error");
      setMessage("Por favor, ingresa tu código PIN.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.vertical) {
          setVertical(data.vertical as Vertical);
        }
        setStatus("success");
        setMessage("¡Acceso correcto! Redirigiendo...");
        setTimeout(() => {
          router.push("/panel");
        }, 1000);
      } else {
        setStatus("error");
        setMessage(data.error || "El código PIN ingresado es incorrecto.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión con el servidor.");
    }
  };

  // Pantalla de carga mientras se verifica la sesión
  if (status === "checking") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
      >
        <div className="text-center space-y-4">
          <span
            className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: colors.accent, borderTopColor: "transparent" }}
          />
          <p
            className="font-mono text-xs tracking-[0.2em] uppercase"
            style={{ color: colors.textSecondary }}
          >
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
    >
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl"
          style={{ backgroundColor: colors.accent }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.03] blur-3xl"
          style={{ backgroundColor: colors.accent }}
        />
      </div>

      <div
        className="w-full max-w-md p-8 sm:p-10 relative font-mono rounded-2xl backdrop-blur-xl"
        style={{
          backgroundColor: `${colors.bgCard}cc`,
          border: `1px solid ${colors.border}40`,
          boxShadow: `0 25px 50px -12px ${colors.accent}10`,
        }}
      >
        {/* Decoración superior */}
        <div
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}
        />

        {/* Brand Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${colors.accent}20`, border: `1px solid ${colors.accent}30` }}
          >
            💪
          </div>
        </div>

        <h2
          className="font-display text-4xl font-light mb-2 text-center"
          style={{ color: colors.textPrimary }}
        >
          {texts.loginTitle}
        </h2>
        <p
          className="font-mono text-[10px] tracking-[0.3em] text-center mb-8 uppercase"
          style={{ color: colors.textSecondary }}
        >
          {texts.loginSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block font-mono text-[10px] tracking-[0.2em] uppercase mb-2"
              style={{ color: colors.textSecondary }}
            >
              {texts.loginPinLabel}
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ej. 123456"
              autoComplete="one-time-code"
              disabled={status === "loading"}
              className="w-full px-4 py-3.5 font-mono text-lg text-center tracking-[0.35em] focus:outline-none rounded-xl transition-all"
              style={{
                backgroundColor: colors.bgPrimary,
                border: `1px solid ${colors.border}60`,
                color: colors.textPrimary,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}20`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = `${colors.border}60`; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {message && (
            <p
              className={`font-display italic text-sm text-center ${
                status === "success" ? "text-green-400" : ""
              }`}
              style={status !== "success" ? { color: colors.accent } : undefined}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-4 font-mono text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-50 font-bold rounded-xl"
            style={{
              backgroundColor: colors.accent,
              color: "#ffffff",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {status === "loading" ? "VERIFICANDO..." : texts.loginButton}
          </button>
        </form>

        {/* Branding footer */}
        <p
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-center mt-8"
          style={{ color: colors.textSecondary }}
        >
          {texts.brand} · Sistema de Fidelización
        </p>
      </div>
    </div>
  );
}
