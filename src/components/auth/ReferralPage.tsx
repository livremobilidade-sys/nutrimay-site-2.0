"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Ticket, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ReferralPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
  onSkip: () => void;
}

export function ReferralPage({ isOpen, onClose, onSuccess, onSkip }: ReferralPageProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isError, setIsError] = useState(false);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleSubmit = () => {
    if (inviteCode.length > 3) {
      onSuccess(inviteCode);
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12 overflow-hidden hide-scrollbar">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 30 }}
            className="relative w-full max-w-2xl bg-[#0c0c0e] border border-white/5 rounded-[4rem] p-12 md:p-20 shadow-[0_80px_200px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Elegant Background Gradient */}
            <div className="absolute top-0 right-0 p-48 bg-[#22C55E]/5 blur-[150px] pointer-events-none" />

            <div className="relative flex flex-col items-center text-center max-w-xl mx-auto">
               <motion.div 
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.2, type: "spring" }}
                 className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8 text-[#22C55E]"
               >
                  <Ticket className="w-8 h-8" />
               </motion.div>

               <div className="inline-flex text-[9px] font-medium uppercase px-4 py-1.5 rounded-full mb-8 bg-white/5 border border-white/10 text-white/40">
                  Verificação de Membro
               </div>

               <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6 uppercase leading-tight">
                  Frescor Absoluto Exige Exclusividade.
               </h2>
               
               <p className="text-[#a1a1aa] text-base md:text-lg font-medium leading-relaxed mb-10">
                  A MayNutri atende uma <span className="text-white">capacidade limitada</span> para garantir que cada meta entregue tenha qualidade máxima. Possui um convite de um membro VIP?
               </p>

               {/* Invite Code Input */}
               <div className="w-full space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="INSIRA SEU CÓDIGO VIP" 
                    className={`w-full bg-white/[0.03] border rounded-2xl p-6 text-center text-white placeholder:text-white/10 transition-all outline-none font-black text-xl tracking-[0.2em] focus:scale-[1.02] ${isError ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 focus:border-[#22C55E]/30'}`}
                  />
                  {inviteCode.length > 3 && !isError && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#22C55E]">
                       <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  {isError && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500">
                       <AlertCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSubmit}
                  className="w-full py-1.5 rounded-full bg-[#22C55E] text-black font-black text-[11px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#22C55E]/20 flex items-center justify-center gap-6 group"
                >
                  {inviteCode.length > 3 ? 'Validar Código VIP' : 'Solicitar Acesso'}
                  <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center group-hover:rotate-[45deg] transition-all duration-500">
                    <ArrowRight className="w-5 h-5 group-hover:rotate-[-45deg] transition-all duration-500" />
                  </div>
                </button>

                <button 
                  onClick={onSkip}
                  className="text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase tracking-[0.2em] block mx-auto pb-4"
                >
                  Não possuo código. Entrar na fila de aprovação
                </button>
               </div>
            </div>

            <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[8px] text-white/10 uppercase font-medium leading-relaxed whitespace-nowrap">
               MayNutri • Exclusive Member Access • 2024
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
