"use client";

import { Target, Clock, Package, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MethodHeaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MethodHeader({ isOpen, onClose }: MethodHeaderProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.button 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={onClose} 
            className="fixed top-6 right-6 md:top-10 md:right-10 p-3 bg-[#1a1a1c]/80 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/10 text-white transition-colors z-[110] shadow-xl"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-5xl bg-[#1a1a1c] border border-white/10 rounded-[2rem] p-8 mt-12 md:mt-0 md:p-12 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar"
          >
            <div className="text-center mb-10 md:mb-12 mt-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
                Como Funciona o Lote Semanal.
              </h2>
              <p className="text-[#a1a1aa] max-w-2xl mx-auto text-lg leading-relaxed">
                Um sistema otimizado para garantir refrescância e qualidade imbatível, direto do produtor para você.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white border border-white/10 shadow-[0_4px_20px_rgba(255,255,255,0.03)]">
                  <Target className="w-8 h-8 text-[#a1a1aa]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Escolha sua Meta</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Selecione mixes para Imunidade, Energia ou Recuperação no nosso catálogo.
                </p>
              </motion.div>

              {/* Connectors (Desktop only) */}
              <motion.div 
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden md:block absolute top-[110px] left-[30%] w-[10%] h-[1px] origin-left bg-gradient-to-r from-white/20 to-transparent pointer-events-none" 
              />
              <motion.div 
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="hidden md:block absolute top-[110px] right-[30%] w-[10%] h-[1px] origin-right bg-gradient-to-l from-white/20 to-transparent pointer-events-none" 
              />

              {/* Step 2 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white border border-white/10 shadow-[0_4px_20px_rgba(255,255,255,0.03)]">
                  <Clock className="w-8 h-8 text-[#a1a1aa]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Fechamento do Lote</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Pedidos encerram toda <strong className="text-white">Terça-feira às 20h</strong>.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white border border-white/10 shadow-[0_4px_20px_rgba(255,255,255,0.03)]">
                  <Package className="w-8 h-8 text-[#a1a1aa]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Retirada Zero Atrito</h3>
                <p className="text-[#a1a1aa] leading-relaxed">
                  Prontas e geladas na <strong className="text-white">Quarta-feira</strong> no seu Ponto de Retirada (B2B).
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
