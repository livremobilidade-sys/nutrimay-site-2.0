import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#1a1a1c] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="flex justify-center mb-10">
          <div className="w-24 h-24 bg-[#22C55E]/10 rounded-full flex items-center justify-center border border-[#22C55E]/20">
            <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Pedido Confirmado.</h1>
        <p className="text-[#a1a1aa] font-medium mb-12 leading-relaxed">
          Sua meta está em processamento. Em breve você receberá os detalhes no seu e-mail cadastrado.
        </p>

        <div className="flex flex-col items-center gap-8">
          <Link 
            href="/produtos"
            className="group relative inline-flex items-center gap-6 px-10 py-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full hover:border-white/20 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <span className="relative text-white font-medium uppercase tracking-[0.4em] text-xs transition-colors">
              Voltar ao Catálogo
            </span>
            <div className="relative w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#22C55E]/20 group-hover:rotate-[45deg] group-hover:border-transparent">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] group-hover:rotate-[-45deg] transition-all duration-500" />
            </div>
          </Link>

          <p className="text-[10px] text-white/20 uppercase tracking-[0.6em] font-medium">
            MayNutri • Premium Selection
          </p>
        </div>
      </div>
    </main>
  );
}
