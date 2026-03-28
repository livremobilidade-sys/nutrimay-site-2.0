"use client";

import { MethodHeader } from "@/components/shop/MethodHeader";
import { BatchStatusBar } from "@/components/shop/BatchStatusBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Cart } from "@/components/cart";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopPage() {
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(true);

  return (
    <main className="min-h-screen bg-[#1a1a1c] pt-32 text-white relative flex flex-col">
      <div className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <div className="inline-block text-[10px] font-medium uppercase tracking-[0.5em] text-[#22C55E] mb-4">
            Catálogo Exclusivo
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase">
            Escolha sua Meta.
          </h2>
          <p className="text-[#a1a1aa] text-lg md:text-xl font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Mixes premium desenhados especificamente para suprir o que sua rotina exige.
          </p>
        </motion.div>
      </div>

      <div className="flex-1">
        <ProductGrid />
      </div>
      <Cart />
      
      <MethodHeader isOpen={isMethodModalOpen} onClose={() => setIsMethodModalOpen(false)} />

      {/* Floating Action Button - Glass Style */}
      <button
        onClick={() => setIsMethodModalOpen(true)}
        className="group fixed bottom-8 right-8 z-40 flex items-center gap-4 bg-transparent outline-none"
      >
        <span className="hidden md:block text-white font-medium uppercase tracking-[0.3em] text-[10px] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
          Como Funciona?
        </span>
        <div className="relative w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#22C55E]/10 group-hover:rotate-[45deg] group-hover:border-[#22C55E]/30 shadow-2xl">
          <HelpCircle className="w-6 h-6 text-white group-hover:rotate-[-45deg] transition-all duration-500" />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-[#22C55E] transition-colors" />
        </div>
      </button>
    </main>
  );
}
