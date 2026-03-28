"use client";

import { AdminSidebar } from "@/components/admin/Sidebar";
import { motion } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#060608] text-white flex overflow-hidden">
      <AdminSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-72 h-screen overflow-y-auto hide-scrollbar scroll-smooth">
        {/* Admin Header Bar */}
        <header className="h-24 sticky top-0 bg-[#060608]/80 backdrop-blur-xl border-b border-white/5 px-12 flex items-center justify-between z-40">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#22C55E] uppercase tracking-widest mb-1 opacity-50">
                 Sistema de Controle
              </span>
              <h1 className="text-sm font-black text-white uppercase tracking-tighter">
                 Painel Operacional
              </h1>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 border border-white/5 rounded-full bg-white/[0.02]">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                 <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none pt-0.5">
                    Servidores Ativos • SSL Ok
                 </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-[#22C55E] uppercase shadow-2xl">
                 AD
              </div>
           </div>
        </header>

        {/* Content Canvas */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 pb-32"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
