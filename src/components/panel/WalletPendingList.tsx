"use client";

import { useState } from "react";

interface WalletTx {
  id: string;
  customerName: string;
  customerPhone: string;
  type: "TIENDA" | "MENSUALIDAD" | "REDEEM";
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: number;
  percentage: number;
  credit: number;
  productName?: string | null;
  planName?: string | null;
  createdAt: string;
}

export default function WalletPendingList({
  transactions,
  onRefresh,
  vertical = "GIMNASIO",
}: {
  transactions: WalletTx[];
  onRefresh: () => void;
  vertical?: string;
}) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";

  const [selectedTx, setSelectedTx] = useState<WalletTx | null>(null);

  // Campos modal de aprobación Tienda
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [percentage, setPercentage] = useState("10"); // Default 10%

  const [loading, setLoading] = useState(false);

  const bgCard = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl" : "bg-[#131110] border border-[#2a2520]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const textPri = isGym ? "text-white" : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300" : "text-[#a89e90]";

  const openApproveModal = (tx: WalletTx) => {
    setSelectedTx(tx);
    if (tx.type === "TIENDA") {
      setProductName(tx.productName || "");
      setPrice(tx.amount > 0 ? tx.amount.toString() : "");
      setPercentage(tx.percentage > 0 ? tx.percentage.toString() : "10");
    }
  };

  const handleApprove = async () => {
    if (!selectedTx) return;
    setLoading(true);

    try {
      let bodyData: any = {};
      if (selectedTx.type === "TIENDA") {
        const parsedPrice = parseFloat(price);
        const parsedPct = parseFloat(percentage);

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          alert("Por favor ingresa un precio válido del producto.");
          setLoading(false);
          return;
        }

        bodyData = {
          productName: productName.trim() || "Producto de Tienda",
          amount: parsedPrice,
          percentage: parsedPct,
        };
      }

      const res = await fetch(`/api/wallet/transactions/${selectedTx.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setSelectedTx(null);
        onRefresh();
      }
    } catch (e) {
      console.error("Error aprobando transacción:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("¿Seguro que deseas rechazar esta solicitud de wallet?")) return;
    try {
      const res = await fetch(`/api/wallet/transactions/${id}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error("Error rechazando transacción:", e);
    }
  };

  const calculatedCredit =
    parseFloat(price || "0") && parseFloat(percentage || "0")
      ? ((parseFloat(price) * parseFloat(percentage)) / 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className={`${bgCard} p-8 text-center`}>
          <p className={`font-mono text-xs ${textMut} italic`}>
            No hay solicitudes de Wallet pendientes por revisar. ✨
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactions.map((tx) => (
            <div key={tx.id} className={`${bgCard} p-5 space-y-4`}>
              <div className="flex justify-between items-start">
                <div>
                  <span
                    className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: tx.type === "TIENDA" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                      color: tx.type === "TIENDA" ? "#60a5fa" : "#34d399",
                      border: `1px solid ${tx.type === "TIENDA" ? "rgba(59,130,246,0.3)" : "rgba(16,185,129,0.3)"}`,
                    }}
                  >
                    {tx.type === "TIENDA" ? "🛍️ COMPRA TIENDA" : "💪 REFERIDO MENSUALIDAD"}
                  </span>
                  <h4 className={`font-display text-lg font-light ${textPri} mt-1`}>
                    {tx.customerName}
                  </h4>
                  <p className={`font-mono text-xs ${textMut}`}>
                    WhatsApp: +{tx.customerPhone}
                  </p>
                </div>
                <span className={`font-mono text-[10px] ${textMut}`}>
                  {new Date(tx.createdAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {tx.type === "MENSUALIDAD" && (
                <div className={`p-3 border ${borderC} bg-white/5 rounded-xl space-y-1 font-mono text-xs`}>
                  <p className={textSec}>Plan: <strong className={textPri}>{tx.planName}</strong></p>
                  <p className={textSec}>Valor Plan: <strong className={textPri}>${tx.amount.toFixed(2)}</strong></p>
                  <p className="text-emerald-400 font-bold">
                    Comisión Estimada: +${tx.credit.toFixed(2)} ({tx.percentage}%)
                  </p>
                </div>
              )}

              {tx.type === "TIENDA" && (
                <div className={`p-3 border ${borderC} bg-white/5 rounded-xl font-mono text-xs ${textMut}`}>
                  ℹ️ Pendiente de ingresar precio del objeto y asignar el porcentaje.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openApproveModal(tx)}
                  className="flex-1 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all"
                >
                  ✓ Aprobar
                </button>
                <button
                  onClick={() => handleReject(tx.id)}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-red-400 border border-red-900/40 hover:bg-red-950/20 rounded-xl transition-all"
                >
                  ✗ Denegar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE APROBACIÓN PARA TIENDA */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`${bgCard} w-full max-w-md p-6 space-y-5 border border-white/20`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className={`font-display text-xl ${textPri}`}>
                Aprobar Solicitud de {selectedTx.type}
              </h3>
              <button onClick={() => setSelectedTx(null)} className={`${textMut} hover:text-white`}>
                ✕
              </button>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <p className={textMut}>Cliente: <strong className={textPri}>{selectedTx.customerName}</strong></p>
              <p className={textMut}>Teléfono: <strong className={textPri}>+{selectedTx.customerPhone}</strong></p>
            </div>

            {selectedTx.type === "TIENDA" ? (
              <div className="space-y-4">
                <div>
                  <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>Nombre del Producto Adquirido</label>
                  <input
                    type="text"
                    placeholder="Ej: Proteína Whey 2lb, Cinto Fuerza"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full bg-[#0a1628] border border-white/15 text-white px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>Precio del Objeto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 25.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/15 text-white px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>% Crédito Wallet</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 10"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      className="w-full bg-[#0a1628] border border-white/15 text-white px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-center">
                  <span className="font-mono text-xs text-slate-300">Se acreditará en dólares:</span>
                  <p className="font-display text-2xl font-bold text-emerald-400">
                    +${calculatedCredit}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-center space-y-1">
                <p className="font-mono text-xs text-slate-300">Plan: {selectedTx.planName}</p>
                <p className="font-display text-2xl font-bold text-emerald-400">
                  +${selectedTx.credit.toFixed(2)} ({selectedTx.percentage}%)
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-2 font-mono text-xs uppercase border border-white/15 text-slate-300 hover:bg-white/5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 py-2 font-mono text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? "Aprobando..." : "Confirmar y Acreditar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
