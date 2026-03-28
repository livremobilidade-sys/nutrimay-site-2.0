"use client";

import { 
  Users, UserPlus, Package, Clock, 
  TrendingUp, ShieldCheck, Mail, ArrowUpRight 
} from "lucide-react";
import { motion } from "framer-motion";

const metrics = [
  { 
    label: "Aprovações Pendentes", 
    value: "14", 
    change: "+3 hoje", 
    icon: UserPlus, 
    color: "text-amber-500", 
    bg: "bg-amber-500/10" 
  },
  { 
    label: "Membros VIP Ativos", 
    value: "128", 
    change: "+12 semana", 
    icon: ShieldCheck, 
    color: "text-[#22C55E]", 
    bg: "bg-[#22C55E]/10" 
  },
  { 
    label: "Pedidos no Lote", 
    value: "42", 
    change: "Meta: 50", 
    icon: Package, 
    color: "text-white", 
    bg: "bg-white/10" 
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-12">
      {/* Header Info */}
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-10 rounded-[2.5rem] bg-[#0c0c0e] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
          >
             {/* Background Glow */}
             <div className={`absolute top-0 right-0 p-24 ${m.bg} opacity-20 blur-[80px] group-hover:opacity-40 transition-opacity`} />

             <div className="relative flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center ${m.color}`}>
                   <m.icon className="w-7 h-7" />
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-2">{m.label}</span>
                   <div className="flex items-baseline gap-4">
                      <span className="text-5xl font-black text-white tracking-tighter">{m.value}</span>
                      <span className={`text-[9px] font-bold uppercase ${m.color} tracking-widest`}>{m.change}</span>
                   </div>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions or Recent Activity */}
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
               {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:bg-white/[0.04] transition-all">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/30">
                           {i === 1 ? 'JC' : i === 2 ? 'MA' : 'RS'}
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-white uppercase tracking-widest">{i === 1 ? 'João Carlos S.' : i === 2 ? 'Maria Augusta' : 'Ricardo Silva'}</p>
                           <p className="text-[9px] font-medium text-white/20 uppercase mt-1">Status: PENDING • Ref: VIP-A24</p>
                        </div>
                     </div>
                     <button className="px-6 py-1.5 bg-[#22C55E] text-black text-[9px] font-black uppercase rounded-full hover:scale-105 active:scale-95 transition-all">
                        Aprovar
                     </button>
                  </div>
               ))}
            </div>
         </div>

         <div className="p-10 rounded-[3rem] bg-[#0c0c0e] border border-white/5 flex flex-col justify-center items-center text-center group">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#22C55E] mb-8 group-hover:scale-110 transition-transform">
               <TrendingUp className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Relatório Semanal</h3>
            <p className="text-[11px] text-white/20 font-medium uppercase leading-relaxed max-w-[280px]">
               Sua taxa de conversão em referências subiu <span className="text-[#22C55E]">24%</span> desde a última terça.
            </p>
            <button className="mt-10 px-10 py-1.5 rounded-full border border-white/10 text-white/40 font-black text-[10px] uppercase hover:bg-white/5 hover:text-white transition-all flex items-center gap-4">
               Explorar Dados <ArrowUpRight className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
}
