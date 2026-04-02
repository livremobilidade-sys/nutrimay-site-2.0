"use client";

import { useEffect, useState } from "react";
import { 
  Users, UserPlus, Package, Clock, 
  TrendingUp, ShieldCheck, Mail, ArrowUpRight 
} from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { 
  collection, query, getDocs, 
  where, count, getCountFromServer 
} from "firebase/firestore";

interface Metric {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  bg: string;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Aprovações Pendentes", value: "0", change: "Carregando...", icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Membros VIP Ativos", value: "0", change: "Carregando...", icon: ShieldCheck, color: "text-[#22C55E]", bg: "bg-[#22C55E]/10" },
    { label: "Pedidos no Lote", value: "0", change: "Carregando...", icon: Package, color: "text-white", bg: "bg-white/10" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const pendingQuery = query(
          collection(db, "users"),
          where("status", "==", "PENDING")
        );
        const pendingSnap = await getDocs(pendingQuery);
        const pendingCount = pendingSnap.size;

        const activeQuery = query(
          collection(db, "users"),
          where("status", "==", "ACTIVE")
        );
        const activeSnap = await getDocs(activeQuery);
        const activeCount = activeSnap.size;

        const batchQuery = query(
          collection(db, "batches"),
          where("deliveryDate", ">=", now.toISOString().split('T')[0])
        );
        const batchSnap = await getDocs(batchQuery);
        let ordersInBatches = 0;
        
        for (const batchDoc of batchSnap.docs) {
          const batchData = batchDoc.data();
          ordersInBatches += (batchData.orderIds?.length || 0);
        }

        const todayOrdersQuery = query(
          collection(db, "orders"),
          where("createdAt", ">=", startOfDay)
        );
        const todayOrdersSnap = await getDocs(todayOrdersQuery);
        const todayOrdersCount = todayOrdersSnap.size;

        const totalOrders = ordersInBatches + todayOrdersCount;

        setMetrics([
          { 
            label: "Aprovações Pendentes", 
            value: pendingCount.toString(), 
            change: pendingCount > 0 ? `${pendingCount} aguardando` : "Nenhuma",
            icon: UserPlus, 
            color: "text-amber-500", 
            bg: "bg-amber-500/10" 
          },
          { 
            label: "Membros VIP Ativos", 
            value: activeCount.toString(), 
            change: activeCount > 0 ? `${activeCount} ativos` : "Nenhum",
            icon: ShieldCheck, 
            color: "text-[#22C55E]", 
            bg: "bg-[#22C55E]/10" 
          },
          { 
            label: "Pedidos no Lote", 
            value: totalOrders.toString(), 
            change: totalOrders > 0 ? "Próxima entrega" : "Nenhum lote",
            icon: Package, 
            color: "text-white", 
            bg: "bg-white/10" 
          },
        ]);
      } catch (error) {
        console.error("Erro ao buscar métricas:", error);
        setMetrics([
          { label: "Aprovações Pendentes", value: "0", change: "Erro", icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Membros VIP Ativos", value: "0", change: "Erro", icon: ShieldCheck, color: "text-[#22C55E]", bg: "bg-[#22C55E]/10" },
          { label: "Pedidos no Lote", value: "0", change: "Erro", icon: Package, color: "text-white", bg: "bg-white/10" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full w-fit">
               <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-[#22C55E]">Lote Aberto • Encerra Terça 20h</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
               Visão Geral.
            </h2>
            <p className="text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
               Monitoramento de Crescimento VIP e Operações de Logística
            </p>
         </div>

         <div className="flex gap-4">
            <button className="px-8 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
               Gerar Relatório
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-10 rounded-[2.5rem] bg-[#0c0c0e] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
          >
             <div className={`absolute top-0 right-0 p-24 ${m.bg} opacity-20 blur-[80px] group-hover:opacity-40 transition-opacity`} />

             <div className="relative flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center ${m.color}`}>
                   <m.icon className="w-7 h-7" />
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-2">{m.label}</span>
                   <div className="flex items-baseline gap-4">
                      <span className="text-5xl font-black text-white tracking-tighter">{loading ? "..." : m.value}</span>
                      <span className={`text-[9px] font-bold uppercase ${m.color} tracking-widest`}>{loading ? "Carregando" : m.change}</span>
                   </div>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="p-10 rounded-[3rem] bg-[#0c0c0e] border border-white/5">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Aprovações de Hoje</h3>
                  <p className="text-[10px] text-white/20 uppercase mt-1">Últimos perfis aguardando liberação</p>
               </div>
               <button className="text-[9px] font-black text-[#22C55E] uppercase border-b border-[#22C55E]/20 hover:border-[#22C55E] transition-all pb-1">Ver Todos</button>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/30">
                        -
                     </div>
                     <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-widest">Nenhuma aprovação pendente</p>
                        <p className="text-[9px] font-medium text-white/20 uppercase mt-1">Todos os perfis foram revisados</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="p-10 rounded-[3rem] bg-[#0c0c0e] border border-white/5 flex flex-col justify-center items-center text-center group">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#22C55E] mb-8 group-hover:scale-110 transition-transform">
               <TrendingUp className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Relatório Semanal</h3>
            <p className="text-[11px] text-white/20 font-medium uppercase leading-relaxed max-w-[280px]">
               Dados atualizados em tempo real
            </p>
            <button className="mt-10 px-10 py-1.5 rounded-full border border-white/10 text-white/40 font-black text-[10px] uppercase hover:bg-white/5 hover:text-white transition-all flex items-center gap-4">
               Explorar Dados <ArrowUpRight className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
}