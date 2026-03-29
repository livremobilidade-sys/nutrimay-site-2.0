"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

type PaymentStatus = 'loading' | 'paid' | 'pending' | 'failed' | 'unknown';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const transactionId = searchParams.get('transaction_id') || searchParams.get('reference_id') || searchParams.get('code');

  useEffect(() => {
    // If no transaction_id in URL, PagBank redirected without a code (can happen on some flows)
    // We show "pending" - the webhook will update the order later
    if (!transactionId) {
      setStatus('pending');
      return;
    }

    // Verify payment status via our API
    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/pagbank/status?id=${transactionId}`);
        if (!res.ok) { setStatus('pending'); return; }
        const data = await res.json();
        const s = data.status?.toUpperCase();
        if (s === 'PAID' || s === 'AUTHORIZED' || s === 'WAITING') {
          setStatus(s === 'WAITING' ? 'pending' : 'paid');
        } else if (s === 'DECLINED' || s === 'CANCELED') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('pending');
      }
    };

    verifyPayment();
  }, [transactionId]);

  const content = {
    loading: {
      icon: <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin" />,
      bg: 'bg-white/5',
      title: 'Verificando pagamento...',
      desc: 'Aguarde enquanto confirmamos seu pedido com o PagBank.',
      cta: null,
    },
    paid: {
      icon: <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />,
      bg: 'bg-[#22C55E]/10 border border-[#22C55E]/20',
      title: 'Pedido Confirmado!',
      desc: 'Pagamento aprovado com sucesso. Prepare-se para receber suas frutas frescas no ponto de retirada selecionado.',
      cta: { label: 'Voltar ao Catálogo', href: '/produtos' },
    },
    pending: {
      icon: <Clock className="w-12 h-12 text-amber-400" />,
      bg: 'bg-amber-500/10 border border-amber-500/20',
      title: 'Pagamento em Processamento',
      desc: 'Seu pedido foi recebido e está aguardando confirmação do pagamento. Para PIX, aguarde a confirmação em até alguns minutos.',
      cta: { label: 'Ver Meu Pedido', href: '/produtos' },
    },
    failed: {
      icon: <XCircle className="w-12 h-12 text-red-400" />,
      bg: 'bg-red-500/10 border border-red-500/20',
      title: 'Pagamento Não Aprovado',
      desc: 'Infelizmente seu pagamento foi recusado. Tente novamente com outro cartão ou use o PIX.',
      cta: { label: 'Tentar Novamente', href: '/produtos' },
    },
    unknown: {
      icon: <Clock className="w-12 h-12 text-amber-400" />,
      bg: 'bg-amber-500/10 border border-amber-500/20',
      title: 'Status em Verificação',
      desc: 'Não conseguimos confirmar o status do pagamento agora. Se o pagamento foi realizado, entraremos em contato.',
      cta: { label: 'Voltar ao Catálogo', href: '/produtos' },
    },
  };

  const c = content[status];

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
      >
        <div className="flex justify-center mb-8">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${c.bg}`}>
            {c.icon}
          </div>
        </div>

        <h1 className="text-3xl font-black mb-4 tracking-tighter uppercase">{c.title}</h1>
        <p className="text-white/40 text-sm font-medium mb-10 leading-relaxed">{c.desc}</p>

        {transactionId && (
          <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest mb-8">
            Ref: {transactionId.substring(0, 20)}...
          </p>
        )}

        {c.cta && (
          <Link
            href={c.cta.href}
            className="group inline-flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-full hover:border-[#22C55E]/40 transition-all"
          >
            <span className="text-white font-black uppercase tracking-widest text-[10px]">{c.cta.label}</span>
            <ArrowRight className="w-4 h-4 text-[#22C55E]" />
          </Link>
        )}

        <p className="mt-10 text-[9px] text-white/10 uppercase tracking-widest font-medium">
          MayNutri • Premium Selection
        </p>
      </motion.div>
    </main>
  );
}
