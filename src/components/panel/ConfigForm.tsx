"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractColorsFromImage } from "@/lib/color-extractor";

interface SettingsProps {
  initialData: {
    riskThresholdNormal: number;
    riskThresholdAt: number;
    loyaltyMode: string;
    visitDurationMin: number | null;
    businessInfo: string | null;
    requiredCuts: number;
    logoUrl?: string | null;
    brandPrimaryColor?: string | null;
    brandSecondaryColor?: string | null;
    brandAccentColor?: string | null;
  };
  isPremium: boolean;
}

export default function ConfigForm({ initialData, isPremium }: SettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    riskThresholdNormal: initialData.riskThresholdNormal,
    riskThresholdAt: initialData.riskThresholdAt,
    loyaltyMode: initialData.loyaltyMode,
    visitDurationMin: initialData.visitDurationMin || "",
    businessInfo: initialData.businessInfo || "",
    requiredCuts: initialData.requiredCuts,
    logoUrl: initialData.logoUrl || "",
    brandPrimaryColor: initialData.brandPrimaryColor || "#d97644",
    brandSecondaryColor: initialData.brandSecondaryColor || "#131110",
    brandAccentColor: initialData.brandAccentColor || "#e08b60",
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    try {
      // 1. Mostrar preview local e extraer colores con canvas
      const objectUrl = URL.createObjectURL(file);
      const extracted = await extractColorsFromImage(objectUrl);

      // 2. Subir imagen a API
      const logoFormData = new FormData();
      logoFormData.append("file", file);
      logoFormData.append("brandPrimaryColor", extracted.primary);
      logoFormData.append("brandSecondaryColor", extracted.secondary);
      logoFormData.append("brandAccentColor", extracted.accent);

      const res = await fetch("/api/barbershop/logo", {
        method: "POST",
        body: logoFormData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir logo");

      setFormData((prev) => ({
        ...prev,
        logoUrl: data.logoUrl,
        brandPrimaryColor: data.brandPrimaryColor || extracted.primary,
        brandSecondaryColor: data.brandSecondaryColor || extracted.secondary,
        brandAccentColor: data.brandAccentColor || extracted.accent,
      }));

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error al procesar la imagen del logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        riskThresholdNormal: parseFloat(formData.riskThresholdNormal.toString()),
        riskThresholdAt: parseFloat(formData.riskThresholdAt.toString()),
        loyaltyMode: formData.loyaltyMode,
        visitDurationMin: formData.visitDurationMin === "" ? null : parseInt(formData.visitDurationMin.toString()),
        requiredCuts: parseInt(formData.requiredCuts.toString()),
        brandPrimaryColor: formData.brandPrimaryColor,
        brandSecondaryColor: formData.brandSecondaryColor,
        brandAccentColor: formData.brandAccentColor,
        logoUrl: formData.logoUrl || null,
      };

      if (isPremium) {
        payload.businessInfo = formData.businessInfo.trim() || null;
      }

      if ((payload.riskThresholdNormal as number) >= (payload.riskThresholdAt as number)) {
        throw new Error("El umbral normal debe ser menor que el umbral de riesgo.");
      }

      const res = await fetch("/api/barbershop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      setSuccess(true);
      router.refresh();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const businessInfoLength = formData.businessInfo.length;
  const BUSINESS_INFO_MAX = 2000;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-mono">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-mono">
          Configuración e identidad de marca guardadas exitosamente.
        </div>
      )}

      {/* Identidad Visual y Logo */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">
            Logo e Identidad de Marca (Branding)
          </h2>
          <p className="text-sm text-[#a89e90] font-sans leading-relaxed">
            Sube el logo de tu negocio. Al subirlo, se extraerán automáticamente los colores principales para personalizar el diseño del panel y las tarjetas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-[#0a0807] border border-[#2a2520]">
          <div className="w-24 h-24 bg-[#1e1b18] border border-[#2a2520] flex items-center justify-center relative overflow-hidden shrink-0 rounded">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo de Negocio" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-[#5c554c] text-xs font-mono text-center px-2">Sin Logo</span>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <label className="inline-block bg-[#2a2520] hover:bg-[#38322b] text-[#f3ece1] font-mono text-xs uppercase tracking-wider py-2.5 px-4 cursor-pointer transition-colors border border-[#38322b]">
              {uploadingLogo ? "Analizando y Subiendo..." : formData.logoUrl ? "Cambiar Logo" : "Subir Logo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
            <p className="text-xs text-[#5c554c]">Formatos soportados: PNG, JPG, SVG, WebP (Máx 5MB).</p>
          </div>
        </div>

        {/* Colores Extraídos / Personalizados */}
        <div className="space-y-3 pt-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono block">
            Paleta de Colores Extraída
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0a0807] p-3 border border-[#2a2520] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a89e90] font-mono">Primario</span>
                <input
                  type="color"
                  name="brandPrimaryColor"
                  value={formData.brandPrimaryColor}
                  onChange={handleChange}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
              <input
                type="text"
                name="brandPrimaryColor"
                value={formData.brandPrimaryColor}
                onChange={handleChange}
                className="w-full bg-[#131110] border border-[#2a2520] text-[#f3ece1] text-xs p-1.5 font-mono uppercase"
              />
            </div>

            <div className="bg-[#0a0807] p-3 border border-[#2a2520] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a89e90] font-mono">Secundario</span>
                <input
                  type="color"
                  name="brandSecondaryColor"
                  value={formData.brandSecondaryColor}
                  onChange={handleChange}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
              <input
                type="text"
                name="brandSecondaryColor"
                value={formData.brandSecondaryColor}
                onChange={handleChange}
                className="w-full bg-[#131110] border border-[#2a2520] text-[#f3ece1] text-xs p-1.5 font-mono uppercase"
              />
            </div>

            <div className="bg-[#0a0807] p-3 border border-[#2a2520] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a89e90] font-mono">Acento</span>
                <input
                  type="color"
                  name="brandAccentColor"
                  value={formData.brandAccentColor}
                  onChange={handleChange}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
              <input
                type="text"
                name="brandAccentColor"
                value={formData.brandAccentColor}
                onChange={handleChange}
                className="w-full bg-[#131110] border border-[#2a2520] text-[#f3ece1] text-xs p-1.5 font-mono uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Información del Negocio — Solo PREMIUM */}
      {isPremium && (
        <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide">
                Información de tu Negocio
              </h2>
              <span className="bg-[#d97644]/10 text-[#d97644] border border-[#d97644]/30 px-2 py-0.5 text-[9px] font-mono rounded">
                PREMIUM
              </span>
            </div>
            <p className="text-sm text-[#a89e90] font-sans leading-relaxed">
              Describe tu barbería: cuántos barberos tienes, desde cuándo operas, horario de atención, 
              servicios que ofreces, zona/barrio, competencia cercana, cualquier detalle relevante. 
              El Director IA usará esta información para personalizar sus recomendaciones.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">
              Descripción del Negocio
            </label>
            <textarea
              name="businessInfo"
              value={formData.businessInfo}
              onChange={handleChange}
              maxLength={BUSINESS_INFO_MAX}
              rows={6}
              placeholder="Ej: Somos una barbería en el centro de Cuenca, operamos desde 2019 con 3 sillas. Atendemos de lunes a sábado de 9am a 7pm. Nuestros servicios principales son corte, barba y cejas. Tenemos competencia directa a 2 cuadras (Barbería X). Nuestro diferenciador es el trato personalizado y la fidelización por WhatsApp."
              className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-4 focus:border-[#d97644] focus:outline-none transition-colors font-sans text-sm leading-relaxed resize-y min-h-[120px]"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#5c554c]">
                Esta información es tu declaración — el Director la usará como contexto, pero si contradice 
                los datos reales del Motor, lo señalará con honestidad.
              </p>
              <span className={`font-mono text-[10px] shrink-0 ml-4 ${
                businessInfoLength > BUSINESS_INFO_MAX * 0.9 
                  ? "text-amber-400" 
                  : "text-[#5c554c]"
              }`}>
                {businessInfoLength} / {BUSINESS_INFO_MAX}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Umbrales de Riesgo */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">Umbrales de Riesgo (Motor de Conocimiento)</h2>
          <p className="text-sm text-[#a89e90] font-sans">
            Configura qué tan rápido el Motor marca a un cliente como atrasado o en riesgo, en base a su ritmo habitual de visitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Recordatorio Preventivo (Nx)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                name="riskThresholdNormal"
                value={formData.riskThresholdNormal}
                onChange={handleChange}
                className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 pl-10 focus:border-[#d97644] focus:outline-none transition-colors font-mono"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c554c] font-mono">X</span>
            </div>
            <p className="text-xs text-[#5c554c] mt-1">Ej: 0.8 significa que si suele venir cada 10 días, al día 8 se le recordará su próximo corte.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">En Riesgo / Atrasado desde (Mx)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="10"
                name="riskThresholdAt"
                value={formData.riskThresholdAt}
                onChange={handleChange}
                className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 pl-10 focus:border-[#d97644] focus:outline-none transition-colors font-mono"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c554c] font-mono">X</span>
            </div>
            <p className="text-xs text-[#5c554c] mt-1">Ej: 2.0 significa que si pasa del día 20 (el doble), entra "En Riesgo".</p>
          </div>
        </div>
      </div>

      {/* Modo de Lealtad */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">Modo de Fidelidad</h2>
          <p className="text-sm text-[#a89e90] font-sans">
            ¿Cómo cuentas las visitas para premios (cortes gratis)?
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Modo de Acumulación</label>
          <select
            name="loyaltyMode"
            value={formData.loyaltyMode}
            onChange={handleChange}
            className="w-full bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:border-[#d97644] focus:outline-none transition-colors font-sans"
          >
            <option value="BY_PROFILE">Por Perfil (Cada persona acumula para sí misma)</option>
            <option value="BY_ACCOUNT">Por Cuenta (Padre e hijo acumulan juntos en el mismo WhatsApp)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Cortes para Premio</label>
          <input
            type="number"
            min="2"
            max="50"
            step="1"
            name="requiredCuts"
            value={formData.requiredCuts}
            onChange={handleChange}
            className="w-full max-w-[200px] bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:border-[#d97644] focus:outline-none transition-colors font-mono"
            required
          />
          <p className="text-xs text-[#5c554c] mt-1">¿Cuántos cortes necesita un cliente para ganar su corte gratis? (Mínimo 2, máximo 50)</p>
        </div>
      </div>

      {/* Duración de la Visita */}
      <div className="bg-[#131110] border border-[#2a2520] p-6 space-y-6">
        <div>
          <h2 className="text-lg text-[#f3ece1] font-display font-light tracking-wide mb-1">Operativa</h2>
          <p className="text-sm text-[#a89e90] font-sans">
            Duración estándar de un servicio. Sirve para calcular capacidad de la barbería.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-[#a89e90] font-mono">Duración (Minutos)</label>
          <input
            type="number"
            min="5"
            max="480"
            name="visitDurationMin"
            value={formData.visitDurationMin}
            onChange={handleChange}
            placeholder="Opcional (Ej. 40)"
            className="w-full max-w-[200px] bg-[#0a0807] border border-[#2a2520] text-[#f3ece1] p-3 focus:border-[#d97644] focus:outline-none transition-colors font-mono"
          />
          <p className="text-xs text-[#5c554c] mt-1">Déjalo en blanco si no quieres capturar la hora de inicio de las visitas.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto bg-[#d97644] text-[#0a0807] hover:bg-[#e08b60] disabled:bg-[#d97644]/50 disabled:cursor-not-allowed font-mono text-sm tracking-[0.2em] uppercase py-4 px-8 transition-colors flex items-center justify-center min-w-[200px]"
      >
        {loading ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}
