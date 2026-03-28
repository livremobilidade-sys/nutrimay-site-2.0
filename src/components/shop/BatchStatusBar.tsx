"use client";

import { useEffect, useState } from "react";
import { useCartStore, checkIsCartClosed, getBatchStatus } from "@/store/useCartStore";

export function BatchStatusBar() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isNextBatch, setIsNextBatch] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateStatus = () => {
      const now = new Date();
      const status = getBatchStatus();
      setIsNextBatch(status.isNextBatch);

      // Find next Tuesday 20:00:00
      let nextTuesday = new Date(now);
      const day = now.getDay();
      
      // Calculate days to next Tuesday (2 is Tuesday)
      let daysToTuesday = (2 - day + 7) % 7;
      if (day === 2 && now.getHours() >= 20) {
        daysToTuesday = 7;
      }

      nextTuesday.setDate(now.getDate() + daysToTuesday);
      nextTuesday.setHours(20, 0, 0, 0);

      const diff = nextTuesday.getTime() - now.getTime();
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`Encerra em: ${d}d ${h}h ${m}m`);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-[#242426]/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 md:gap-4 text-[10px] md:text-sm font-bold relative z-10 shadow-lg">
      <div className="flex items-center gap-1.5 md:gap-2">
        <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.8)]`} />
        <span className="text-white tracking-tight uppercase whitespace-nowrap">
          <span className="hidden sm:inline">Lote: </span>
          <span className={isNextBatch ? "text-[#f6a838]" : "text-[#22C55E]"}>{isNextBatch ? "PRÓXIMO" : "ABERTO"}</span>
        </span>
      </div>
      
      <div className="text-[#f6a838] tracking-tight whitespace-nowrap border-l border-white/10 pl-2 md:pl-4">
        {timeLeft.replace("Encerra em: ", "")}
      </div>
    </div>
  );
}
