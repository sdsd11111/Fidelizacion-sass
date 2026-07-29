"use client";

import { useState, useEffect } from "react";
import WalletPendingList from "@/components/panel/WalletPendingList";
import WalletBalanceTable from "@/components/panel/WalletBalanceTable";

export default function WalletClientPage({
  vertical = "GIMNASIO",
  shopName,
}: {
  vertical?: string;
  shopName: string;
}) {
  const isGym = vertical === "GIMNASIO";
  const accent = isGym ? "#3b82f6" : "#d97644";

  const [activeTab, setActiveTab] = useState<"pending" | "balances">("pending");
  const [pendingTxs, setPendingTxs] = useState([]);
  const [balances, setBalances] = useState([]);
  const [configPlans, setConfigPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const bgCard = isGym ? "bg-[#0f2040]/80 backdrop-blur-xl border border-white/15 rounded-2xl" : "bg-[#131110] border border-[#2a2520]";
  const borderC = isGym ? "border-white/15" : "border-[#2a2520]";
  const textPri = isGym ? "text-white" : "text-[#f3ece1]";
  const textMut = isGym ? "text-slate-400" : "text-[#5c554c]";
  const textSec = isGym ? "text-slate-300" : "text-[#a89e90]";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPending, resBalances, resConfig] = await Promise.all([
        fetch("/api/wallet/transactions?status=PENDING"),
        fetch("/api/wallet/balances"),
        fetch("/api/wallet/config"),
      ]);

      if (resPending.ok) {
        const pData = await resPending.json();
        setPendingTxs(pData);
      }

      if (resBalances.ok) {
        const bData = await resBalances.json();
        setBalances(bData);
      }

      if (resConfig.ok) {
        const cData = await resConfig.json();
        if (cData.plans && Array.isArray(cData.plans)) {
          setConfigPlans(cData.plans);
        }
      }
    } catch (e) {
      console.error("Error cargando datos de Wallet:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalGymCredit = balances.reduce((sum: number, b: any) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      {/* HEADER HERO */}
      <div className={`${bgCard} p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6`}>
        <div>
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
            SISTEMA DE FIDELIZACIÓN & CASHBACK
          </span>
          <h1 className={`font-display text-2xl sm:text-4xl md:text-5xl font-light ${textPri} mt-1`}>
            Wallet de {shopName}
          </h1>
          <p className={`font-mono text-[10px] sm:text-xs ${textMut} mt-2 max-w-xl leading-relaxed`}>
            Administra las compras en tienda, las comisiones por referir mensualidades y los canjes de tus miembros en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-2xl w-fit">
          <div>
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase ${textMut}`}>Saldo Total</span>
            <p className="font-display text-xl sm:text-3xl font-bold text-emerald-400">
              ${totalGymCredit.toFixed(2)}
            </p>
          </div>
          <div className="border-l border-white/10 pl-4 sm:pl-6">
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase ${textMut}`}>Miembros</span>
            <p className={`font-display text-xl sm:text-3xl font-bold ${textPri}`}>
              {balances.length}
            </p>
          </div>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex gap-2 sm:gap-3 border-b border-white/15 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs tracking-wider uppercase font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === "pending"
              ? "bg-blue-600 text-white rounded-xl shadow-lg"
              : `${textMut} hover:text-white hover:bg-white/5 rounded-xl`
          }`}
        >
          <span>Pendientes</span>
          {pendingTxs.length > 0 && (
            <span className="bg-amber-500 text-black px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold animate-pulse">
              {pendingTxs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("balances")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 font-mono text-[10px] sm:text-xs tracking-wider uppercase font-bold transition-all whitespace-nowrap ${
            activeTab === "balances"
              ? "bg-blue-600 text-white rounded-xl shadow-lg"
              : `${textMut} hover:text-white hover:bg-white/5 rounded-xl`
          }`}
        >
          Saldos ({balances.length})
        </button>
      </div>

      {/* VISTA SEGÚN TAB */}
      {loading ? (
        <div className={`${bgCard} p-12 text-center`}>
          <p className={`font-mono text-xs ${textMut} animate-pulse`}>Cargando información de Wallet...</p>
        </div>
      ) : activeTab === "pending" ? (
        <WalletPendingList transactions={pendingTxs} plans={configPlans} onRefresh={fetchData} vertical={vertical} />
      ) : (
        <WalletBalanceTable balances={balances} onRefresh={fetchData} vertical={vertical} />
      )}
    </div>
  );
}
