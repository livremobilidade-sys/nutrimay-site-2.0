"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldCheck, Mail, ArrowRight, X } from "lucide-react";
import { useEffect } from "react";

interface WaitlistScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistScreen({ isOpen, onClose }: WaitlistScreenProps) {
  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-hidden hide-scrollbar">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 30 }}
            className="relative w-full max-w-4xl bg-[#0c0c0e] border border-white/5 rounded-[4rem] p-12 md:p-24 shadow-[0_80px_200px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Elegant Background Gradient */}
            <div className="absolute top-0 right-0 p-48 bg-[#22C55E]/5 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-40 bg-white/2 blur-[100px] pointer-events-none" />

            <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto">
               <motion.div 
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.2, type: "spring" }}
                 className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 text-[#22C55E] shadow-2xl"
               >
                  <Clock className="w-10 h-10" />
               </motion.div>

               <div className="inline-flex text-[9px] font-medium uppercase px-4 py-1.5 rounded-full mb-8 bg-white/5 border border-white/10 text-white/40">
                  Aprovação Pendente
               </div>

               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 uppercase leading-tight">
                  Sua Entrada Está Próxima.
               </h2>
               
               <p className="text-[#a1a1aa] text-lg md:text-xl font-medium leading-relaxed mb-12">
                  Você está na nossa <span className="text-white">Lista de Espera VIP</span>. A MayNutri atende uma capacidade limitada para garantir frescor absoluto. Avisaremos por e-mail quando sua entrada for liberada.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-4 transition-all hover:bg-white/10">
                     <ShieldCheck className="w-6 h-6 text-[#22C55E]/50" />
                     <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Qualidade Atômica</span>
                     <span className="text-[9px] font-medium text-white/20 uppercase leading-none">Garantia Nutricional</span>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-4 transition-all hover:bg-white/10">
                     <Mail className="w-6 h-6 text-[#22C55E]/50" />
                     <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Aviso Imediato</span>
                     <span className="text-[9px] font-medium text-white/20 uppercase leading-none">Confirmação via E-mail</span>
                  </div>
               </div>

               <button 
                onClick={onClose}
                className="mt-16 py-1.5 px-12 rounded-full border border-white/10 text-white/40 font-black text-[10px] uppercase transition-all hover:bg-white/5 hover:text-white flex items-center gap-4"
               >
                  Voltar ao Início
                  <ArrowRight className="w-4 h-4" />
               </button>
            </div>

            <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[8px] text-white/10 uppercase font-medium leading-relaxed whitespace-nowrap">
               MayNutri • Premium Waitlist • 2024
            </p>
          </motion.div>

           <button 
            onClick={onClose} 
            className="fixed top-12 right-12 p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white transition-all z-[210] shadow-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </AnimatePresence>
  );
}
