"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function InfoPopup() {
  const [show, setShow] = useState(false);

  // Control popup visibility (once a day)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = "infoPopupLastShownDate";
      const lastShownDate = localStorage.getItem(key);
      const today = new Date().toDateString();

      if (lastShownDate !== today) {
        setShow(true);
        localStorage.setItem(key, today);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />
      {/* Modal */}
      <div className="relative max-w-md w-full bg-[#0c0c0e] border border-white/10 rounded-2xl p-6 shadow-xl z-10">
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-black text-white mb-4">Como funciona a compra?</h3>
        <p className="text-sm text-white/70 leading-relaxed">
          • Cada “Mix” representa um conjunto de frutas premium que você pode adicionar ao seu carrinho.<br />
          • Ao clicar em “Adicionar à Meta” o item entra no seu carrinho e o total é atualizado em tempo real.<br />
          • Quando estiver pronto, finalize o checkout e pague com cartão ou PIX via PagBank.<br />
          • Seu pedido será processado e enviado em até 48 h.
        </p>
        <button
          onClick={() => setShow(false)}
          className="mt-6 w-full py-2 rounded-xl bg-[#22C55E] text-black font-black"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
