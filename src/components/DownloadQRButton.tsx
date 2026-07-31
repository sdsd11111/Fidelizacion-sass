"use client";

import { useState } from "react";

interface DownloadQRButtonProps {
  qrUrl: string;
  /** Nombre del negocio / sección (ej. "Tienda", "Carlos", "Gimnasio General") */
  barbershopName: string;
  /** Vertical del tenant. Determina el prefijo del archivo y el color del botón. */
  vertical?: "BARBERIA" | "GIMNASIO";
}

export default function DownloadQRButton({
  qrUrl,
  barbershopName,
  vertical = "BARBERIA",
}: DownloadQRButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const isGym = vertical === "GIMNASIO";

  // Color del acento según vertical (mismo que vertical-theme.ts)
  const accent = isGym ? "#3b82f6" : "#d97644";
  const accentHover = isGym ? "#60a5fa" : "#e8854f";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Descargar la imagen como Blob para forzar descarga limpia de archivo en el navegador
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      const cleanName = barbershopName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      const prefix = isGym ? "qr_gimnasio" : "qr_barberia";
      link.download = `${prefix}_${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error descargando el código QR:", err);
      // Fallback si la descarga por blob se bloquea
      window.open(qrUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="mt-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase border transition-all rounded disabled:opacity-50 flex items-center gap-1.5"
      style={{
        color: accent,
        borderColor: `${accent}66`,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.backgroundColor = `${accent}1a`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${accent}66`;
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span>⬇</span>
      <span>{downloading ? "Guardando..." : "Descargar QR"}</span>
    </button>
  );
}
