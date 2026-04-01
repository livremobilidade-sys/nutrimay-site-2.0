"use client";

import { useCartStore, checkIsCartClosed, getBatchStatus } from "@/store/useCartStore";
import { useState, useEffect } from "react";
import { AlertCircle, Trash2, X, Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export function Cart() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupPointsList, setPickupPointsList] = useState<any[]>([]);

  
  const {
    items,
    removeItem,
    updateQuantity,
    pickupPoint,
    setPickupPoint,
    thermalBagOption,
    setThermalBagOption,
    isCartOpen,
    closeCart,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
    
    // Load pickup points from Firebase
    const loadPickupPoints = async () => {
      try {
        const q = query(collection(db, "pickupPoints"), where("active", "==", true));
        const snapshot = await getDocs(q);
        const points: any[] = [];
        snapshot.forEach(doc => {
          points.push({ id: doc.id, ...doc.data() });
        });
        setPickupPointsList(points);
      } catch (e) {
        console.error('Error loading pickup points:', e);
      }
    };
    
    loadPickupPoints();
  }, []);

  if (!mounted) return null;

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isClosed = checkIsCartClosed();
  const { isNextBatch, deliveryDate } = getBatchStatus();

  const pickupPoints = pickupPointsList.length > 0 
    ? pickupPointsList.map(p => p.name) 
    : ["Selecione um ponto"];

  const bagOptions = [
    { id: "new", label: "Primeira compra? (+ Bolsa Térmica R$ 10,00)" },
    { id: "exchange", label: "Já tenho a bolsa (Trocarei na entrega)" },
  ];

  const finalTotal = thermalBagOption === "new" ? total + 10 : total;

  const isCheckoutEnabled =
    items.length > 0 &&
    typeof pickupPoint === "string" && pickupPoint !== "" &&
    typeof thermalBagOption === "string";

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };


  return (
    <>
      {/* OVERLAY */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] w-full md:w-[480px] bg-[#1a1a1c]/95 backdrop-blur-3xl text-white shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/10 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Minha Meta.</h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Business Rule Warning */}
        <div className={`p-4 border-b flex items-start gap-3 ${isNextBatch ? 'bg-[#2a1e1a] text-[#f6a838] border-[#f6a838]/20' : 'bg-[#1a2a1a] text-[#22C55E] border-[#22C55E]/20'}`}>
          {isNextBatch ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm font-medium">
            {isNextBatch 
              ? `Lote encerrado para esta semana. Seu pedido será entregue na ${deliveryDate}.`
              : `Pedido garantido para entrega ${deliveryDate}.`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
              <p className="text-xl font-medium tracking-tight">Sua meta está vazia.</p>
              <p className="text-sm mt-2">Escolha seus produtos no catálogo.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-contain drop-shadow-lg" />
                  <div className="flex-1">
                    <h4 className="font-medium text-xs uppercase mb-1">{item.name}</h4>
                    <p className="text-[#22C55E] font-black text-lg tracking-tighter uppercase">
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/30 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white/10 rounded-md"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white/10 rounded-md"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ms-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="flex flex-col gap-6 mt-6">
              {/* Pickup Point Selection (Dropdown) */}
              <div>
                <label className="block text-[10px] font-medium mb-4 text-white/40 uppercase">
                  Ponto de Retirada (B2B)
                </label>
                <select 
                  className="w-full bg-[#242426] border border-white/10 rounded-xl p-4 text-white font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none appearance-none cursor-pointer"
                  value={pickupPoint || ""}
                  onChange={(e) => setPickupPoint(e.target.value)}
                >
                  <option value="" disabled>Selecione seu Ponto de Retirada...</option>
                  {pickupPoints.map(point => (
                    <option key={point} value={point}>{point}</option>
                  ))}
                </select>
              </div>

              {/* Thermal Bag Selection */}
              <div>
                <label className="block text-[10px] font-medium mb-4 text-white/40 uppercase">
                  Embalagem (Obrigatório)
                </label>
                <div className="flex flex-col gap-2">
                  {bagOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        thermalBagOption === option.id
                          ? "border-[#22C55E] bg-[#22C55E]/10"
                          : "border-white/10 bg-[#242426] hover:border-white/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="bag"
                        value={option.id}
                        checked={thermalBagOption === option.id}
                        onChange={() => setThermalBagOption(option.id as "new" | "exchange")}
                        className="w-5 h-5 accent-[#22C55E]"
                      />
                      <span className="font-medium text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t border-white/10 bg-[#1a1a1c]">
            <div className="flex justify-between items-end mb-8">
              <span className="text-[10px] font-medium text-white/30 uppercase pb-1">Total Final</span>
              <span className="text-4xl font-black tracking-tighter">R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
            </div>
            
            <button
              disabled={!isCheckoutEnabled || isProcessing}
              onClick={handleCheckout}
              className={`group relative w-full py-1.5 rounded-full font-medium text-[10px] uppercase transition-all flex items-center justify-center gap-10 shadow-2xl overflow-hidden ${
                !isCheckoutEnabled || isProcessing
                  ? "bg-white/5 text-white/20"
                  : "bg-[#22C55E] text-black hover:scale-[1.01] active:scale-95 hover:shadow-[#22C55E]/20"
              }`}
            >
              <span className="relative z-10 transition-colors">
                {isProcessing ? "Processando..." : "Ir para o Checkout"}
              </span>
              
              {isCheckoutEnabled && !isProcessing && (
                <div className="relative w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center transition-all duration-500 group-hover:rotate-[45deg]">
                  <ArrowRight className="w-5 h-5 text-black group-hover:rotate-[-45deg] transition-all duration-500" />
                </div>
              )}
            </button>
            
            {!isCheckoutEnabled && (
              <p className="text-center text-[10px] text-[#f6a838]/80 mt-6 font-medium uppercase tracking-[0.1em]">
                Complete as preferências para avançar.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
