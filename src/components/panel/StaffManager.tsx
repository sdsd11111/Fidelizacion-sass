"use client";

import { useState, useEffect, useRef } from "react";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
}

export default function StaffManager({ vertical = "BARBERIA" }: { vertical?: string }) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";

  // Theme vars
  const bgCard  = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl" : "bg-[#131110] border border-[#2a2520]";
  const bgDark  = isGym ? "bg-[#0a1628]"   : "bg-[#0a0807]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const textPri = isGym ? "text-white"      : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400"  : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300"  : "text-[#a89e90]";

  const staffEmoji = isGym ? "🏋️" : "💈";
  const staffLabel = isGym ? "entrenador" : "barbero";
  const staffLabelCap = isGym ? "Entrenador" : "Barbero";
  const staffLabelTeam = isGym ? "Entrenador del equipo" : "Barbero del equipo";
  const ownerLabel = isGym ? "Dueño / Entrenador Principal" : "Dueño / Barbero Principal";

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newName, setNewName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/barbershop/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (e) {
      console.error("Error cargando equipo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Selecciona una imagen menor a 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/barbershop/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), photoUrl: photoPreview }),
      });
      if (res.ok) {
        setNewName("");
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchStaff();
      }
    } catch (e) {
      console.error("Error agregando miembro:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePhoto = async (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/barbershop/staff", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, photoUrl: base64 }),
        });
        if (res.ok) fetchStaff();
      } catch (e) {
        console.error("Error actualizando foto:", e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm(`¿Seguro que deseas eliminar a este ${staffLabel}?`)) return;
    try {
      const res = await fetch(`/api/barbershop/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error("Error eliminando miembro:", e);
    }
  };

  return (
    <div className={`${bgCard} p-5 sm:p-8 space-y-6 overflow-x-hidden min-w-0`}>
      <div className={`border-b ${borderC} pb-4`}>
        <span className={`font-mono text-xs tracking-[0.2em] uppercase ${textMut} break-words`}>
          Equipo de Trabajo / Profesionales
        </span>
        <p className={`font-mono text-xs ${textSec} mt-1`}>
          Agrega a las personas que atienden en tu establecimiento y sube su fotografía. Tus clientes los seleccionarán al calificar o agendar.
        </p>
      </div>

      {/* Formulario para agregar */}
      <form onSubmit={handleAddStaff} className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center min-w-0">
          {/* Avatar selector preview */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-14 h-14 ${bgDark} border ${borderC} rounded-full overflow-hidden flex items-center justify-center relative shrink-0`}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-2xl ${textMut}`}>{staffEmoji}</span>
              )}
            </div>
            <div className="min-w-0">
              <label
                htmlFor="staff-photo-input"
                className={`cursor-pointer font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 transition-colors inline-block whitespace-nowrap ${isGym ? `bg-white/10 ${textPri} hover:bg-white/20 rounded-lg` : "bg-[#2a2520] text-[#f3ece1] hover:bg-[#3a3530]"}`}
              >
                {photoPreview ? "Cambiar Foto" : "Subir Foto"}
              </label>
              <input
                id="staff-photo-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className={`font-mono text-[9px] ${textMut} mt-1 whitespace-nowrap`}>
                PNG, JPG (Máx. 5MB)
              </p>
            </div>
          </div>

          {/* Input + botón */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full min-w-0">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Nombre del profesional (ej: Carlos, Juan)`}
              className={`flex-1 min-w-0 border px-4 py-2.5 font-mono text-xs focus:outline-none ${
                isGym
                  ? `${bgDark} border-white/15 text-white focus:border-blue-400 rounded-xl placeholder:text-slate-500`
                  : "bg-[#0a0807] border-[#2a2520] text-[#f3ece1] focus:border-[#d97644]"
              }`}
            />
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className={`px-5 py-2.5 font-mono text-xs tracking-widest uppercase font-bold shrink-0 whitespace-nowrap transition-all disabled:opacity-50 ${isGym ? "rounded-xl" : ""}`}
              style={{
                backgroundColor: accent,
                color: isGym ? "#ffffff" : "#0a0807",
              }}
            >
              {submitting ? "Agregando..." : "+ Agregar"}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de miembros */}
      {loading ? (
        <p className={`font-mono text-xs ${textMut}`}>Cargando lista...</p>
      ) : staff.length === 0 ? (
        <p className={`font-mono text-xs ${textMut} italic`}>
          No has registrado miembros aún. Si no agregas ninguno, la pregunta por WhatsApp se omitirá automáticamente.
        </p>
      ) : (
        <ul className="space-y-3 pt-2 min-w-0">
          {staff.map((s, idx) => (
            <li
              key={s.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between border p-4 gap-3 min-w-0 overflow-hidden ${
                isGym ? `bg-white/5 ${borderC} rounded-xl` : `bg-[#0a0807] border-[#2a2520]`
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Avatar */}
                <div className={`w-12 h-12 border rounded-full overflow-hidden flex items-center justify-center shrink-0 relative group ${isGym ? `bg-white/10 ${borderC}` : "bg-[#131110] border-[#2a2520]"}`}>
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{staffEmoji}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold shrink-0" style={{ color: accent }}>
                      {idx + 1}.
                    </span>
                    <span className={`font-display text-lg ${textPri} truncate`}>
                      {s.name}
                    </span>
                  </div>
                  <p className={`font-mono text-[10px] ${textMut} truncate`}>
                    {s.role === "OWNER" ? ownerLabel : staffLabelTeam}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <label className={`cursor-pointer font-mono text-[10px] tracking-wider uppercase hover:underline whitespace-nowrap`} style={{ color: accent }}>
                  Cambiar Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpdatePhoto(s.id, file);
                    }}
                  />
                </label>

                <button
                  onClick={() => handleDeleteStaff(s.id)}
                  className={`font-mono text-[10px] tracking-widest uppercase text-red-400 hover:text-red-300 transition-colors border border-red-900/40 bg-red-950/20 px-3 py-1 ${isGym ? "rounded-lg" : ""}`}
                >
                  Eliminar ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
