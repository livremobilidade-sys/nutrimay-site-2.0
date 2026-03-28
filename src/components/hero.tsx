"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  {
    word: "TEMPO",
    image: "/frutas-bag.png", // We can use the bags as visual abstraction of the product
    color: "#911f2d",
    desc: "A seleção perfeita de frutas silvestres prontas em segundos. Valorize cada instante do seu dia com a nutrição que você merece."
  },
  {
    word: "ALTA PERFORMANCE",
    image: "/manga.png",
    color: "#F6A838",
    desc: "A dose exata de energia natural para começar o dia no topo. Esqueça o artificial, o seu corpo pede vitalidade real."
  },
  {
    word: "RECUPERAÇÃO",
    image: "/goiaba.png",
    color: "#E26C7A",
    desc: "Blinde o seu corpo e acelere sua recuperação celular. A dose ideal para quem exige o máximo do próprio corpo."
  },
  {
    word: "IMUNIDADE",
    image: "/kiwi.png",
    color: "#99C355",
    desc: "Uma explosão de Vitamina C intocada. Congelado no ápice do frescor para manter seu sistema imunológico à frente."
  },
  {
    word: "ESTILO DE VIDA",
    image: "/mirtilo.png",
    color: "#46529D",
    desc: "Nutrição e sabor sem compromissos. Descubra a forma mais eficiente de manter manter a saúde como prioridade número 1."
  }
];

export function Hero({ onExploreClick }: { onExploreClick?: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % BENEFITS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const current = BENEFITS[index];

  return (
    <section className="relative h-[100dvh] md:h-[100dvh] flex items-center justify-center overflow-hidden bg-[#1a1a1c] text-white">
      {/* Background Split */}
      <div className="absolute inset-y-0 left-0 w-[55%] bg-[#242426] z-0 transition-colors duration-1000" />

      {/* Removed Background Decorative Rings */}
      {/* Main Content Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.3, ease: [0.25, 1, 0.5, 1] }}
        className="container px-4 z-10 mx-auto grid grid-cols-1 lg:grid-cols-2 h-full gap-2 md:gap-8 relative pb-4 md:pb-8 pt-[74px] md:pt-10"
      >
        
        <div className="hidden lg:flex absolute top-1/2 left-[60%] xl:left-[60%] -translate-x-1/2 -translate-y-1/2 w-[400px] xl:w-[500px] h-[500px] xl:h-[550px] z-20 items-center justify-center pointer-events-none">
          {/* Removed Subtle Radial Glow Behind Desktop Image */}
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={current.image}
              src={current.image}
              alt={`MayNutri ${current.word}`}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="object-contain w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)]"
            />
          </AnimatePresence>
        </div>

        {/* LEFT COLUMN */}
        <div className="flex flex-col h-full justify-center lg:pt-12">
          
          {/* Top Left: Animated Title */}
          <div className="mb-1 md:mb-12 lg:mb-20 z-10 pt-2 w-full flex-shrink-0">
            <h1 className="font-black tracking-tight leading-[1.1]">
              <div className="relative mb-2">
                <span className="block text-white text-3xl md:text-5xl mb-2 font-bold tracking-normal">A MayNutri entrega</span>
              </div>
              <div className="relative min-h-[95px] md:min-h-[140px] lg:min-h-[140px] w-full flex items-start overflow-hidden pt-1">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={current.word}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="block font-black tracking-tighter uppercase relative w-full text-[40px] sm:text-5xl md:text-7xl lg:text-[75px] leading-[1.1] pb-2"
                    style={{ color: current.color }}
                  >
                    {current.word}
                  </motion.span>
                </AnimatePresence>
              </div>
            </h1>
          </div>

          <div className="lg:hidden w-full h-[26vh] min-h-[250px] flex items-center justify-center my-0 md:my-8 z-20 relative py-1">
             {/* Removed Subtle Radial Glow Behind Mobile Image */}
             <AnimatePresence mode="popLayout">
              <motion.img 
                key={current.image}
                src={current.image}
                alt={`MayNutri ${current.word}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="absolute object-contain max-h-full w-full max-w-[85%] md:max-w-[70%] drop-shadow-2xl hover:scale-105 transition-transform"
              />
            </AnimatePresence>
          </div>

          {/* Bottom Left: Nutrição e Sabor -> Consequência */}
          <div className="max-w-sm z-10 w-full lg:w-4/5 pt-0 pb-1 mt-6 md:mt-12 flex-shrink-0">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 }}
              className="mt-2 md:mt-10"
            >
              <motion.button 
                onClick={onExploreClick}
                className="group inline-flex items-center gap-8 bg-transparent cursor-pointer text-left"
              >
                <div className="flex flex-col items-start">
                  <span className="text-white font-medium uppercase tracking-[0.4em] text-xs md:text-sm mb-2 group-hover:translate-x-2 transition-transform duration-500">
                    Explorar Catálogo
                  </span>
                  <motion.div 
                    initial={{ width: "40px" }}
                    animate={{ backgroundColor: current.color, width: "100%" }}
                    className="h-[1.5px] opacity-40 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                
                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-white/10 group-hover:backdrop-blur-xl group-hover:rotate-[45deg] group-hover:border-white/20">
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-[-45deg] transition-all duration-500" />
                  
                  {/* Subtle corner accent inside the box */}
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-white/40 group-hover:border-white transition-colors" />
                </div>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col justify-center items-end h-full pt-10 pb-10 z-30">
          
          {/* Arrows */}
          <div className="hidden lg:flex w-full justify-end pr-10 items-center gap-6">
            <button 
              onClick={() => setIndex((prev) => (prev - 1 + BENEFITS.length) % BENEFITS.length)}
              className="hover:-translate-x-2 transition-transform cursor-pointer opacity-50 hover:opacity-100"
            >
              <ArrowLeft className="w-8 h-8 text-[#d4c6a9]" />
            </button>
            <button 
              onClick={() => setIndex((prev) => (prev + 1) % BENEFITS.length)}
              className="hover:translate-x-2 transition-transform cursor-pointer opacity-50 hover:opacity-100"
            >
              <ArrowRight className="w-8 h-8 text-[#d4c6a9]" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
