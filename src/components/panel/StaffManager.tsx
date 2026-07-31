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
  const staffLabelTeam = isGym ? "Entrenador del equipo" : "Barbero del equipo";
  const ownerLabel = isGym ? "Dueño / Entrenador Principal" : "Dueño / Barbero Principal";

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newName, setNewName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edición inline de nombre + foto por miembro
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal de foto ampliada
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // --- AGREGAR ---
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

  // --- EDITAR (nombre y/o foto) ---
  const startEditing = (s: StaffMember) => {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingPhoto(s.photoUrl || null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingPhoto(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Selecciona una imagen menor a 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditingPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editingName.trim()) {
      alert(`El nombre del ${staffLabel} no puede estar vacío.`);
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch("/api/barbershop/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editingName.trim(),
          photoUrl: editingPhoto,
        }),
      });
      if (res.ok) {
        await fetchStaff();
        cancelEditing();
      } else {
        alert("No se pudo guardar. Inténtalo de nuevo.");
      }
    } catch (e) {
      console.error("Error actualizando miembro:", e);
    } finally {
      setSavingEdit(false);
    }
  };

  // --- ELIMINAR ---
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
                <button
                  type="button"
                  onClick={() => setPhotoModalUrl(photoPreview)}
                  className="w-full h-full"
                  title="Ver foto completa"
                >
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </button>
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
          {staff.map((s, idx) => {
            const isEditing = editingId === s.id;

            return (
              <li
                key={s.id}
                className={`flex flex-col gap-3 border p-4 min-w-0 overflow-hidden ${
                  isGym ? `bg-white/5 ${borderC} rounded-xl` : `bg-[#0a0807] border-[#2a2520]`
                }`}
              >
                {isEditing ? (
                  /* ───── MODO EDICIÓN ───── */
                  <div className="space-y-4 min-w-0">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Foto editable */}
                      <div className={`w-16 h-16 border rounded-full overflow-hidden flex items-center justify-center shrink-0 relative ${isGym ? `bg-white/10 ${borderC}` : "bg-[#131110] border-[#2a2520]"}`}>
                        {editingPhoto ? (
                          <button
                            type="button"
                            onClick={() => setPhotoModalUrl(editingPhoto)}
                            className="w-full h-full"
                            title="Ver foto completa"
                          >
                            <img src={editingPhoto} alt={s.name} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-2xl">{staffEmoji}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`edit-photo-${s.id}`}
                          className={`cursor-pointer font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 transition-colors inline-block whitespace-nowrap ${isGym ? `bg-white/10 ${textPri} hover:bg-white/20 rounded-lg` : "bg-[#2a2520] text-[#f3ece1] hover:bg-[#3a3530]"}`}
                        >
                          {editingPhoto ? "Cambiar Foto" : "Subir Foto"}
                        </label>
                        <input
                          id={`edit-photo-${s.id}`}
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageSelect}
                          className="hidden"
                        />
                        {editingPhoto && (
                          <button
                            type="button"
                            onClick={() => setEditingPhoto(null)}
                            className="ml-2 font-mono text-[10px] tracking-wider uppercase text-red-400 hover:text-red-300 whitespace-nowrap"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder={`Nombre del ${staffLabel}`}
                        className={`flex-1 min-w-0 border px-4 py-2.5 font-mono text-xs focus:outline-none ${
                          isGym
                            ? `${bgDark} border-white/15 text-white focus:border-blue-400 rounded-xl`
                            : "bg-[#131110] border-[#2a2520] text-[#f3ece1] focus:border-[#d97644]"
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className={`px-4 py-2.5 font-mono text-xs tracking-widest uppercase font-bold shrink-0 whitespace-nowrap transition-all disabled:opacity-50 ${isGym ? "rounded-xl" : ""}`}
                        style={{
                          backgroundColor: accent,
                          color: isGym ? "#ffffff" : "#0a0807",
                        }}
                      >
                        {savingEdit ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={savingEdit}
                        className={`px-4 py-2.5 font-mono text-xs tracking-widest uppercase font-bold shrink-0 whitespace-nowrap transition-all border ${
                          isGym
                            ? `${borderC} ${textPri} hover:bg-white/5 rounded-xl`
                            : "border-[#2a2520] text-[#a89e90] hover:border-[#3a3530]"
                        }`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ───── MODO VISTA ───── */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Avatar */}
                      <button
                        type="button"
                        onClick={() => s.photoUrl && setPhotoModalUrl(s.photoUrl)}
                        className={`w-12 h-12 border rounded-full overflow-hidden flex items-center justify-center shrink-0 relative group ${isGym ? `bg-white/10 ${borderC}` : "bg-[#131110] border-[#2a2520]"} ${s.photoUrl ? "cursor-zoom-in" : "cursor-default"}`}
                        title={s.photoUrl ? "Ver foto completa" : undefined}
                      >
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{staffEmoji}</span>
                        )}
                      </button>

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

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => startEditing(s)}
                        className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 border hover:opacity-90 transition-all whitespace-nowrap"
                        style={{
                          color: accent,
                          borderColor: `${accent}66`,
                          backgroundColor: "transparent",
                        }}
                        title={`Editar ${staffLabel}`}
                      >
                        Editar ✎
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className={`font-mono text-[10px] tracking-widest uppercase text-red-400 hover:text-red-300 transition-colors border border-red-900/40 bg-red-950/20 px-3 py-1 ${isGym ? "rounded-lg" : ""}`}
                      >
                        Eliminar ✕
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal de foto ampliada */}
      {photoModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPhotoModalUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPhotoModalUrl(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black text-lg font-bold shadow-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
              aria-label="Cerrar"
            >
              ✕
            </button>
            <img
              src={photoModalUrl}
              alt="Foto completa"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
