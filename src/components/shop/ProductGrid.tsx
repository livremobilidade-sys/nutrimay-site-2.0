"use client";

import { useCartStore, Product } from "@/store/useCartStore";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";

// Fallback colors based on product tag
const getColorByTag = (tag: string) => {
  const map: Record<string, string> = {
    "PRÉ/PÓS-TREINO": "#F6A838",
    "DETOX/VITALIDADE": "#99C355",
    "PÓS-TREINO": "#E26C7A",
    "BEM-ESTAR/LONGEVIDADE": "#46529D",
    "VITAMINAS": "#22C55E",
    "DETOX": "#6EE7B7",
    "ENERGIA": "#FCD34D",
    "ANTIOXIDANTE": "#F87171",
  };
  return map[tag?.toUpperCase()] || "#22C55E";
};

export function ProductGrid() {
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple query - no composite index required
    const q = query(
      collection(db, "products"),
      orderBy("orderIndex", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = snapshot.docs
        .map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || "",
            description: d.marketingCopy || "",
            price: d.price || 0,
            image: d.image || "",
            benefits: d.groups || [d.tag || "Premium", "Saúde"],
            color: getColorByTag(d.tag),
            tag: d.tag || "",
            title: d.name || "",
            status: d.status,
          };
        })
        .filter((p: any) => p.status === "ACTIVE"); // Filter client-side

      setProducts(data);
      setLoading(false);
      setError(null);
      console.log(`🔥 [StoreFront] ${data.length} produtos ativos carregados.`);
    }, (err) => {
      console.error("❌ [StoreFront] Erro ao carregar produtos:", err);
      setError("Erro ao carregar catálogo.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section className="bg-[#1a1a1c] py-24 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 text-[#22C55E] animate-spin" />
        <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em]">Carregando Catálogo VIP...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-[#1a1a1c] py-24 flex flex-col items-center justify-center gap-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-white/30 text-xs font-black uppercase tracking-widest">{error}</p>
      </section>
    );
  }

  return (
    <section className="bg-[#1a1a1c] py-8 md:py-12" id="catalogo">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
          {products.map((prod, i) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/10 group relative transition-all flex flex-col h-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:border-white/20"
            >
              {/* Product Image Area */}
              <div className="relative h-64 md:h-72 w-full bg-[#1e1e20]/50 flex items-center justify-center p-8 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-10"
                  style={{ backgroundColor: prod.color }}
                />
                {prod.image ? (
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="max-h-full max-w-full drop-shadow-[0_25px_45px_rgba(0,0,0,0.8)] z-10 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-4xl">🥤</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-8 pt-6 flex flex-col flex-grow relative z-20">
                <div className="inline-flex text-[9px] font-medium uppercase tracking-[0.4em] px-4 py-1.5 rounded-full w-max mb-6 bg-white/5 border border-white/10 text-white/40 group-hover:text-white/80 transition-colors">
                  {prod.tag}
                </div>

                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-3 uppercase leading-none">
                  {prod.name}
                </h3>

                <p className="text-[#a1a1aa] font-medium text-sm leading-relaxed mb-8 flex-grow">
                  {prod.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="font-black text-white text-lg tracking-tighter uppercase mb-0.5">MayNutri.</span>
                    <span className="text-[10px] text-white/40 font-medium tracking-[0.2em] uppercase">Meta Diária</span>
                  </div>

                  <button
                    onClick={() => addItem(prod)}
                    className="relative w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#22C55E]/20 group-hover:border-[#22C55E]/40"
                    title="Adicionar à Sacola"
                  >
                    <Plus className="w-6 h-6 text-white group-hover:text-[#22C55E] transition-colors" />
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-[#22C55E] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/10 text-xs font-black uppercase tracking-widest">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </div>
    </section>
  );
}
