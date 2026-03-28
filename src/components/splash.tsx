"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Splash() {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    // phase 0: Dot in center (0 - 300ms)
    // phase 1: Assembly (300 - 800ms)
    // phase 2: Hold (800 - 1300ms)
    // phase 3: Glide (1300 - 2000ms)
    const t1 = setTimeout(() => setPhase(1), 300); 
    const t2 = setTimeout(() => setPhase(2), 800); 
    const t3 = setTimeout(() => setPhase(3), 1300); 
    const t4 = setTimeout(() => setPhase(4), 2000); 
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  if (phase >= 4) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Dark background fading out during glide */}
      <motion.div 
        className="absolute inset-0 bg-[#1a1a1c]"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase >= 3 ? 0 : 1 }}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      />
      
      {/* The Unified HTML Logo that glides to header */}
      <AnimatePresence>
        {phase < 3 && (
          <motion.div
            layoutId="brand-logo-container"
            className="flex items-baseline relative z-10 whitespace-nowrap"
          >
            {/* The Text "MayNutri" sliding from left to meet the dot */}
            <motion.div
              className="font-bold text-4xl md:text-5xl tracking-tighter text-white pr-[4px]"
              initial={{ opacity: 0, x: -30, filter: "blur(8px)" }}
              animate={
                phase >= 1 
                ? { opacity: 1, x: 0, filter: "blur(0px)" }
                : { opacity: 0, x: -30, filter: "blur(8px)" }
              }
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            >
              MayNutri
            </motion.div>
            
            {/* The Green Dot entering first, then sliding directly to its edge */}
            <motion.div
              className="bg-[#22C55E] flex-shrink-0"
              initial={{ width: 10, height: 10, scale: 0, opacity: 0, x: -30 }} // Shifted left to fake geometric center initially
              animate={
                phase >= 1 
                ? { scale: 1, opacity: 1, x: 0 } // Glides right
                : { scale: 1, opacity: 1, x: -30 }
              }
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
