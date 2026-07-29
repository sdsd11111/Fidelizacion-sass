"use client";

import { useState } from "react";

interface WalletBalance {
  customerPhone: string;
  customerName: string;
  balance: number;
  lastActivity: string;
  txCount: number;
}

interface WalletTx {
  id: string;
  type: string;
  status: string;
  amount: number;
  percentage?: number;
  credit: number;
  productName?: string | null;
  planName?: string | null;
  adminNote?: string | null;
  createdAt: string;
}

export default function WalletBalanceTable({
  balances,
  onRefresh,
  vertical = "GIMNASIO",
}: {
  balances: WalletBalance[];
  onRefresh: () => void;
  vertical?: string;
}) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";

  const [selectedCustomer, setSelectedCustomer] = useState<WalletBalance | null>(null);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemNote, setRedeemNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Drawer historial
  const [historyCustomer, setHistoryCustomer] = useState<WalletBalance | null>(null);
  const [historyTxs, setHistoryTxs] = useState<WalletTx[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const bgCard = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl" : "bg-[#131110] border border-[#2a2520]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const textPri = isGym ? "text-white" : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300" : "text-[#a89e90]";

  const openRedeemModal = (customer: WalletBalance) => {
    setSelectedCustomer(customer);
    setRedeemAmount("");
    setRedeemNote("");
  };

  const openHistoryDrawer = async (customer: WalletBalance) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);

    try {
      const res = await fetch(`/api/wallet/transactions?customerPhone=${customer.customerPhone}&status=APPROVED`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTxs(data);
      }
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !redeemAmount) return;

    const val = parseFloat(redeemAmount);
    if (isNaN(val) || val <= 0) {
      alert("Por favor ingresa un monto válido a canjear.");
      return;
    }

    if (val > selectedCustomer.balance) {
      alert(`El monto a canjear ($${val}) supera el saldo disponible ($${selectedCustomer.balance.toFixed(2)}).`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: selectedCustomer.customerPhone,
          customerName: selectedCustomer.customerName,
          amount: val,
          note: redeemNote.trim() || "Canje manual en caja",
        }),
      });

      if (res.ok) {
        alert(`¡Canje de $${val.toFixed(2)} registrado exitosamente! Se envió notificación WhatsApp al cliente.`);
        setSelectedCustomer(null);
        onRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "Error registrando canje");
      }
    } catch (e) {
      console.error("Error realizando canje:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredBalances = balances.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.toLowerCase().includes(q)
    );
  });

  // Si está buscando, muestra todos los coincidentes; si no, limita a 10 por página
  const totalPages = Math.ceil(filteredBalances.length / ITEMS_PER_PAGE);
  const displayedBalances = searchQuery.trim()
    ? filteredBalances
    : filteredBalances.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Buscador de cliente por nombre o teléfono */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o WhatsApp..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className={`w-full border px-3 sm:px-4 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs focus:outline-none transition-all ${
              isGym
                ? "bg-[#0a1628] border-white/15 text-white focus:border-blue-400 rounded-xl placeholder:text-slate-500"
                : "bg-[#0a0807] border-[#2a2520] text-[#f3ece1] focus:border-[#d97644]"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${textMut} hover:text-white`}
            >
              ✕
            </button>
          )}
        </div>
        <span className={`font-mono text-[9px] sm:text-xs ${textMut}`}>
          {displayedBalances.length} de {balances.length} clientes
        </span>
      </div>

      {balances.length === 0 ? (
        <div className={`${bgCard} p-8 text-center`}>
          <p className={`font-mono text-xs ${textMut} italic`}>
            No hay clientes con saldo registrado en la Wallet aún.
          </p>
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className={`${bgCard} p-8 text-center`}>
          <p className={`font-mono text-xs ${textMut} italic`}>
            No se encontraron clientes que coincidan con &quot;{searchQuery}&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* DESKTOP: Tabla normal */}
          <div className={`${bgCard} overflow-hidden hidden md:block`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${borderC} font-mono text-[10px] uppercase ${textMut} bg-white/5`}>
                  <th className="p-4">Cliente / Referidor</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Operaciones</th>
                  <th className="p-4">Saldo</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderC}`}>
                {displayedBalances.map((b) => (
                <tr key={b.customerPhone} className="font-mono text-xs hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className={`font-bold ${textPri}`}>{b.customerName}</p>
                    <span className={`text-[10px] ${textMut}`}>
                      {new Date(b.lastActivity).toLocaleDateString("es-EC")}
                    </span>
                  </td>
                  <td className={`p-4 ${textSec}`}>+{b.customerPhone}</td>
                  <td className={`p-4 ${textMut}`}>{b.txCount} txs</td>
                  <td className="p-4 font-display text-xl font-bold text-emerald-400">
                    ${b.balance.toFixed(2)}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2 items-center">
                    <button
                      onClick={() => openHistoryDrawer(b)}
                      className={`px-3 py-1.5 font-mono text-[10px] uppercase border border-white/15 ${textSec} hover:bg-white/10 rounded-xl transition-all`}
                    >
                      📜 Historial
                    </button>
                    <button
                      onClick={() => openRedeemModal(b)}
                      disabled={b.balance <= 0}
                      className="px-3 py-1.5 font-mono text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-40"
                    >
                      💸 Canje
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {/* MOBILE: Cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {displayedBalances.map((b) => (
              <div key={b.customerPhone} className={`${bgCard} p-4 space-y-3`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-mono text-sm font-bold ${textPri}`}>{b.customerName}</p>
                    <p className={`font-mono text-[10px] ${textMut}`}>+{b.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-emerald-400">${b.balance.toFixed(2)}</p>
                    <span className={`font-mono text-[9px] ${textMut}`}>{b.txCount} operaciones</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openHistoryDrawer(b)}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase border border-white/15 ${textSec} hover:bg-white/10 rounded-xl transition-all text-center`}
                  >
                    📜 Historial
                  </button>
                  <button
                    onClick={() => openRedeemModal(b)}
                    disabled={b.balance <= 0}
                    className="flex-1 py-2 font-mono text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-40 text-center"
                  >
                    💸 Canje
                  </button>
                </div>
              </div>
            ))}
          </div>

        {!searchQuery && displayedBalances.length < filteredBalances.length && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className={`px-5 py-2 font-mono text-xs uppercase tracking-wider border border-white/20 hover:bg-white/10 ${textPri} rounded-xl transition-all`}
            >
              Cargar más (+10)
            </button>
          </div>
        )}
      </div>
      )}

      {/* MODAL DE CANJE */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`${bgCard} w-full max-w-md p-6 space-y-5 border border-white/20`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className={`font-display text-xl ${textPri}`}>
                Registrar Canje de Wallet
              </h3>
              <button onClick={() => setSelectedCustomer(null)} className={`${textMut} hover:text-white`}>
                ✕
              </button>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <p className={textMut}>Cliente: <strong className={textPri}>{selectedCustomer.customerName}</strong></p>
              <p className={textMut}>Número: <strong className={textPri}>+{selectedCustomer.customerPhone}</strong></p>
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl mt-2 flex justify-between items-center">
                <span className={textSec}>Saldo Disponible:</span>
                <span className="font-display text-2xl font-bold text-emerald-400">
                  ${selectedCustomer.balance.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>Monto a Descontar ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedCustomer.balance}
                  placeholder={`Máximo $${selectedCustomer.balance.toFixed(2)}`}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-full bg-[#0a1628] border border-white/15 text-white px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className={`font-mono text-[10px] uppercase ${textMut} block mb-1`}>Nota / Concepto del Canje (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Descuento en mensualidad, Bebida energética"
                  value={redeemNote}
                  onChange={(e) => setRedeemNote(e.target.value)}
                  className="w-full bg-[#0a1628] border border-white/15 text-white px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <p className={`font-mono text-[10px] ${textMut} italic`}>
                ℹ️ Al confirmar se descontará el monto y se enviará una notificación WhatsApp automática al cliente.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-2 font-mono text-xs uppercase border border-white/15 text-slate-300 hover:bg-white/5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !redeemAmount}
                  className="flex-1 py-2 font-mono text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50"
                >
                  {submitting ? "Procesando..." : "Confirmar Canje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER HISTORIAL */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className={`${bgCard} w-full max-w-lg h-full p-6 space-y-6 overflow-y-auto border-l border-white/20`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className={`font-display text-xl ${textPri}`}>
                  Historial de Wallet
                </h3>
                <p className={`font-mono text-xs ${textMut}`}>
                  {historyCustomer.customerName} (+{historyCustomer.customerPhone})
                </p>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className={`${textMut} hover:text-white text-xl`}>
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <p className={`font-mono text-xs ${textMut}`}>Cargando historial...</p>
            ) : historyTxs.length === 0 ? (
              <p className={`font-mono text-xs ${textMut} italic`}>No hay transacciones registradas.</p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {historyTxs.map((tx) => (
                  <div key={tx.id} className={`p-4 border ${borderC} bg-white/5 rounded-xl space-y-1`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase" style={{ color: tx.credit < 0 ? "#f87171" : "#34d399" }}>
                        {tx.type === "REDEEM" ? "💸 CANJE REALIZADO" : tx.type === "TIENDA" ? "🛍️ COMPRA TIENDA" : "💪 COMISIÓN REFERIDO"}
                      </span>
                      <span className="font-display text-lg font-bold" style={{ color: tx.credit < 0 ? "#f87171" : "#34d399" }}>
                        {tx.credit > 0 ? `+$${tx.credit.toFixed(2)}` : `-$${Math.abs(tx.credit).toFixed(2)}`}
                      </span>
                    </div>

                    {tx.type === "TIENDA" && (
                      <p className={textSec}>Producto: <strong className={textPri}>{tx.productName}</strong> (${tx.amount.toFixed(2)} al {tx.percentage}%)</p>
                    )}

                    {tx.type === "MENSUALIDAD" && (
                      <p className={textSec}>Plan: <strong className={textPri}>{tx.planName}</strong> (${tx.amount.toFixed(2)} al {tx.percentage}%)</p>
                    )}

                    {tx.adminNote && (
                      <p className={`${textMut} italic text-[10px]`}>Nota: &quot;{tx.adminNote}&quot;</p>
                    )}

                    <p className={`${textMut} text-[9px] pt-1`}>
                      {new Date(tx.createdAt).toLocaleString("es-EC")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
