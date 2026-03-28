"use client";

import { useCartStore } from "@/store/useCartStore";
import { Plus } from "lucide-react";

const PRODUCTS = [
  {
    id: "recuperacao",
    name: "RECUPERAÇÃO",
    subtitle: "O Seu Escudo Antioxidante",
    description: "Blinde o seu corpo e acelere sua recuperação celular. A seleção perfeita de frutas silvestres (Morango, Framboesa, Amora) para quem exige o máximo do próprio corpo, pronta em segundos.",
    price: 189.9,
    image: "/frutas-bag.png",
    benefits: ["Antioxidante", "Recuperação"],
  },
  {
    id: "energia-limpa",
    name: "ENERGIA LIMPA",
    subtitle: "Combustível para a sua Rotina",
    description: "A dose exata de energia natural para começar o dia no topo da sua performance. Esqueça os energéticos artificiais (com Manga), o seu corpo pede vitalidade real.",
    price: 169.9,
    image: "/manga.png",
    benefits: ["Metabolismo", "Energia"],
  },
  {
    id: "imunidade",
    name: "IMUNIDADE",
    subtitle: "A Sua Defesa Diária",
    description: "Uma explosão de Vitamina C intocada. Congelado (com Kiwi) no ápice do frescor para garantir que seu sistema imunológico esteja sempre um passo à frente.",
    price: 179.9,
    image: "/kiwi.png",
    benefits: ["Vitamina C", "Imunidade"],
  },
  {
    id: "foco",
    name: "FOCO & LONGEVIDADE",
    subtitle: "Alta Performance Mental",
    description: "O alimento do cérebro. Rico em nutrientes essenciais (com Mirtilo) para manter sua mente afiada durante as reuniões mais longas ou os treinos mais intensos.",
    price: 199.9,
    image: "/mirtilo.png",
    benefits: ["Memória", "Foco"],
  },
];

export function Catalog() {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <section id="produtos" className="py-24 container mx-auto px-4">
      <div className="mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Escolha o seu Resultado</h2>
        <p className="text-[var(--foreground)]/60 max-w-2xl mx-auto text-lg">
          Nós não vendemos apenas frutas. Nós entregamos performance, recuperação e vitalidade na sua porta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="group relative overflow-hidden rounded-3xl border border-[var(--foreground)]/10 bg-[var(--background)] hover:shadow-2xl hover:shadow-[var(--primary)]/10 transition-all duration-300 flex flex-col"
          >
            {/* Image & Badges */}
            <div className="aspect-[4/3] w-full relative overflow-hidden bg-white dark:bg-neutral-900 group-hover:bg-[#111] transition-colors">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <h3 className="text-3xl font-black text-white tracking-widest">{product.name}</h3>
              </div>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl"
              />
            </div>
            
            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-[var(--primary)] mb-1">{product.subtitle}</h4>
                <div className="flex gap-2 flex-wrap mb-4">
                  {product.benefits.map((b) => (
                    <span
                      key={b}
                      className="px-2 py-1 text-[10px] uppercase font-bold tracking-widest border border-[var(--foreground)]/20 text-[var(--foreground)] rounded-full"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-[var(--foreground)]/70 mb-6 text-sm flex-1 leading-relaxed">{product.description}</p>
              
              <div className="flex justify-between items-end mt-auto mb-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-widest">Investimento</span>
                  <span className="text-2xl font-bold text-[var(--foreground)]">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => addItem(product)}
                className="w-full py-4 rounded-xl font-bold bg-[var(--foreground)]/5 hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                <Plus className="w-5 h-5" /> Adicionar à Meta
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
