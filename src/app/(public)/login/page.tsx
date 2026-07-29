"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTheme, type Vertical } from "@/lib/vertical-theme";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "checking">("checking");
  const [message, setMessage] = useState("");
  const [vertical, setVertical] = useState<Vertical>("BARBERIA");
  const router = useRouter();

  const theme = getTheme(vertical);
  const { colors, texts } = theme;

  // Verificar si ya hay sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/barbershop/status");
        if (res.ok) {
          // Ya tiene sesión activa, redirigir al panel
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
        // Detectar la vertical del negocio para mostrar branding correcto
        if (data.vertical) {
          setVertical(data.vertical as Vertical);
        }
        setStatus("success");
        setMessage("¡Acceso correcto! Redirigiendo...");
        // Redirigir al panel de control
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

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === "checking") {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
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
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
    >
      <div
        className="w-full max-w-md p-10 relative font-mono"
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Decoración superior */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: colors.accent }}
        />

        <h2
          className="font-display text-4xl font-light mb-4 text-center"
          style={{ color: colors.textPrimary }}
        >
          {texts.loginTitle}
        </h2>
        <p
          className="font-mono text-xs tracking-wider text-center mb-8 uppercase"
          style={{ color: colors.textSecondary }}
        >
          {texts.loginSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block font-mono text-xs tracking-[0.2em] uppercase mb-2"
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
              className="w-full px-4 py-3 font-mono text-lg text-center tracking-[0.35em] focus:outline-none"
              style={{
                backgroundColor: colors.bgPrimary,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.border; }}
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
            className="w-full py-4 font-mono text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-50 font-bold"
            style={{
              backgroundColor: colors.accent,
              color: colors.bgPrimary,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
          >
            {status === "loading" ? "VERIFICANDO..." : texts.loginButton}
          </button>
        </form>
      </div>
    </main>
  );
}
