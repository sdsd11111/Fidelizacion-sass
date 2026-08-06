"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { extractColorsFromImage } from "@/lib/color-extractor";

interface LogoBrandingSectionProps {
  initialLogoUrl?: string | null;
  initialPrimaryColor?: string | null;
  initialSecondaryColor?: string | null;
  initialAccentColor?: string | null;
  vertical?: string;
}

export default function LogoBrandingSection({
  initialLogoUrl,
  initialPrimaryColor,
  initialSecondaryColor,
  initialAccentColor,
  vertical = "BARBERIA",
}: LogoBrandingSectionProps) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl || "");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState<string>(initialPrimaryColor || "#3b82f6");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState<string>(initialSecondaryColor || "#1e2d4a");
  const [brandAccentColor, setBrandAccentColor] = useState<string>(initialAccentColor || "#60a5fa");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGym = vertical === "GIMNASIO";

  // Aplicar cambios de color en tiempo real a la interfaz
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (brandPrimaryColor) {
        document.documentElement.style.setProperty("--accent", brandPrimaryColor);
        document.documentElement.style.setProperty("--theme-accent", brandPrimaryColor);
        document.documentElement.style.setProperty("--brand-primary", brandPrimaryColor);
      }
      if (brandSecondaryColor) {
        document.documentElement.style.setProperty("--card", brandSecondaryColor);
        document.documentElement.style.setProperty("--theme-card", brandSecondaryColor);
        document.documentElement.style.setProperty("--brand-secondary", brandSecondaryColor);
      }
      if (brandAccentColor) {
        document.documentElement.style.setProperty("--brand-accent", brandAccentColor);
        document.documentElement.style.setProperty("--theme-accent-hover", brandAccentColor);
      }
    }
  }, [brandPrimaryColor, brandSecondaryColor, brandAccentColor]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Previsualizar y extraer colores
      const objectUrl = URL.createObjectURL(file);
      const extracted = await extractColorsFromImage(objectUrl);

      // 2. Subir imagen
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandPrimaryColor", extracted.primary);
      formData.append("brandSecondaryColor", extracted.secondary);
      formData.append("brandAccentColor", extracted.accent);

      const res = await fetch("/api/barbershop/logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el logo");

      setLogoUrl(data.logoUrl || objectUrl);
      if (data.brandPrimaryColor) setBrandPrimaryColor(data.brandPrimaryColor);
      if (data.brandSecondaryColor) setBrandSecondaryColor(data.brandSecondaryColor);
      if (data.brandAccentColor) setBrandAccentColor(data.brandAccentColor);

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || "Error al procesar la imagen del logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveColors = async () => {
    setSavingColors(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/barbershop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandPrimaryColor,
          brandSecondaryColor,
          brandAccentColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar los colores");

      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      setError(err.message || "Error al actualizar los colores");
    } finally {
      setSavingColors(false);
    }
  };

  return (
    <div
      className="p-6 border rounded-lg space-y-6 shadow-lg transition-all"
      style={{
        backgroundColor: "var(--theme-card, #131110)",
        borderColor: "var(--theme-border, #2a2520)",
      }}
    >
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-light text-white flex items-center gap-2">
            🖼️ Logo e Identidad Visual del {isGym ? "Gimnasio" : "Negocio"}
          </h3>
          {logoUrl && (
            <span
              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border"
              style={{
                backgroundColor: `${brandPrimaryColor}25`,
                color: brandPrimaryColor,
                borderColor: `${brandPrimaryColor}50`,
              }}
            >
              Logo Activo
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300 mt-1 font-sans">
          Sube el logo oficial. Extraeremos automáticamente los colores de tu marca y los aplicaremos en la plataforma.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded">
          ¡Identidad visual actualizada correctamente! Los colores del logo ya están aplicados.
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded bg-black/30 border border-white/10">
        {/* Vista previa del logo */}
        <div className="w-28 h-28 bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0 rounded-md shadow-inner">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo del Negocio" className="w-full h-full object-contain p-2" />
          ) : (
            <span className="text-slate-500 text-xs font-mono text-center px-2">Sin Logo Subido</span>
          )}
        </div>

        <div className="space-y-3 flex-1">
          <label
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider py-3 px-5 rounded cursor-pointer transition-transform hover:scale-[1.02] shadow-md font-bold text-black"
            style={{ backgroundColor: brandPrimaryColor }}
          >
            {uploadingLogo ? (
              <span>⌛ Analizando y Subiendo...</span>
            ) : (
              <span>📤 {logoUrl ? "Cambiar Logo" : "Subir Logo"}</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="hidden"
            />
          </label>
          <p className="text-xs text-slate-400">
            Formatos recomendados: PNG o SVG transparente (Máx 5MB).
          </p>
        </div>
      </div>

      {/* Selector y vista previa de paleta de colores */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <label className="text-xs uppercase tracking-widest text-slate-300 font-mono block">
          Colores Extraídos del Logo (Branding)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Primario */}
          <div className="bg-black/30 p-3 rounded border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono">Color Primario</span>
              <input
                type="color"
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <input
              type="text"
              value={brandPrimaryColor}
              onChange={(e) => setBrandPrimaryColor(e.target.value)}
              className="w-full bg-black/50 border border-white/10 text-white text-xs p-2 font-mono uppercase rounded"
            />
          </div>

          {/* Secundario */}
          <div className="bg-black/30 p-3 rounded border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono">Color Secundario</span>
              <input
                type="color"
                value={brandSecondaryColor}
                onChange={(e) => setBrandSecondaryColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <input
              type="text"
              value={brandSecondaryColor}
              onChange={(e) => setBrandSecondaryColor(e.target.value)}
              className="w-full bg-black/50 border border-white/10 text-white text-xs p-2 font-mono uppercase rounded"
            />
          </div>

          {/* Acento */}
          <div className="bg-black/30 p-3 rounded border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono">Color Acento</span>
              <input
                type="color"
                value={brandAccentColor}
                onChange={(e) => setBrandAccentColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <input
              type="text"
              value={brandAccentColor}
              onChange={(e) => setBrandAccentColor(e.target.value)}
              className="w-full bg-black/50 border border-white/10 text-white text-xs p-2 font-mono uppercase rounded"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveColors}
            disabled={savingColors}
            className="font-mono text-xs uppercase tracking-wider py-3 px-6 rounded transition-transform hover:scale-[1.02] font-bold text-black shadow-md"
            style={{ backgroundColor: brandPrimaryColor }}
          >
            {savingColors ? "Guardando..." : "Guardar Ajustes de Color"}
          </button>
        </div>
      </div>
    </div>
  );
}
