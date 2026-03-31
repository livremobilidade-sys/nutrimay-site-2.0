"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type OrderStatus = 'PAID' | 'AUTHORIZED' | 'WAITING_PAYMENT' | 'IN_ANALYSIS' | 'DECLINED' | 'CANCELED' | 'pending';

interface Order {
  id: string;
  referenceId: string;
  orderId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  paymentMethod: string;
}

const getStatusConfig = (status: string) => {
  const s = status?.toUpperCase() || 'PENDING';
  
  if (s === 'PAID' || s === 'AUTHORIZED') {
    return {
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22C55E]/10 border-[#22C55E]/20',
      label: 'Aprovado',
    };
  }
  if (s === 'WAITING_PAYMENT' || s === 'IN_ANALYSIS' || s === 'PENDING') {
    return {
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      label: 'Em Análise',
    };
  }
  if (s === 'DECLINED' || s === 'CANCELED') {
    return {
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Recusado',
    };
  }
  return {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-neutral-400',
    bg: 'bg-neutral-500/10 border-neutral-500/20',
    label: 'Pendente',
  };
};

export default function PedidosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const ordersData: Order[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            referenceId: data.referenceId || '',
            orderId: data.orderId || data.pagbankOrderId || '',
            status: data.status || 'pending',
            total: data.total || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            paymentMethod: data.paymentMethod || 'credit_card',
          });
        });
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 py-6">
        <div className="container mx-auto px-6 max-w-4xl flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-neutral-500" />
            <div className="flex items-baseline relative z-10 whitespace-nowrap">
              <span className="font-bold text-2xl tracking-tight text-white">May</span>
              <span className="font-light text-2xl tracking-tight text-white pr-1">Nutri</span>
              <div className="w-[6px] h-[6px] bg-[#22C55E]" />
            </div>
          </Link>
          <div className="text-neutral-500 font-bold text-xs uppercase">Meus Pedidos</div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Meus Pedidos</h1>
          <Link 
            href="/produtos" 
            className="px-6 py-3 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-full hover:scale-105 transition-transform"
          >
            Novo Pedido
          </Link>
        </div>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Package className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhum pedido ainda</h2>
            <p className="text-neutral-500 mb-8">Faça sua primeira compra e acompanhe aqui.</p>
            <Link 
              href="/produtos" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-full hover:scale-105 transition-transform"
            >
              Ver Catálogo
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">Pedido #{order.referenceId?.slice(-8) || order.id.slice(-6)}</p>
                        <p className="text-neutral-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl text-white">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                      <p className="text-neutral-500 text-xs uppercase">
                        {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </div>
                    
                    <Link
                      href={`/pedido/${order.id}`}
                      className="text-[#22C55E] text-xs font-bold uppercase hover:underline"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
