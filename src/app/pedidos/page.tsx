"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, AlertCircle, X, QrCode, ClipboardCheck, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type OrderStatus = 'PAID' | 'AUTHORIZED' | 'WAITING_PAYMENT' | 'IN_ANALYSIS' | 'DECLINED' | 'CANCELED' | 'pending';

interface Order {
  id: string;
  referenceId: string;
  orderId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  paymentMethod: string;
  items: any[];
  pickupPoint: string;
  userEmail?: string;
  userName?: string;
  thermalBag?: boolean;
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingPix, setIsCheckingPix] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixText, setPixText] = useState<string | null>(null);

  const fetchPixCode = async (orderId: string) => {
    try {
      const res = await fetch(`/api/pagbank/order-qrcode?id=${orderId}`);
      const data = await res.json();
      if (data.qrcode) {
        setPixQrCode(data.qrcode);
        setPixText(data.text);
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code:', err);
    }
  };

  const checkPixStatus = async (orderId: string) => {
    setIsCheckingPix(true);
    try {
      const res = await fetch(`/api/pagbank/status?id=${orderId}`);
      const data = await res.json();
      
      if (data.status === 'PAID' || data.status === 'AUTHORIZED') {
        setSelectedOrder(prev => prev ? { ...prev, status: 'PAID' } : null);
        alert('Pagamento aprovado!');
      } else if (data.status === 'DECLINED' || data.status === 'CANCELED') {
        setSelectedOrder(prev => prev ? { ...prev, status: 'DECLINED' } : null);
        alert('Pagamento recusado.');
      } else {
        alert('Pagamento ainda não confirmado. Aguarde e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    } finally {
      setIsCheckingPix(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      
      console.log('🔍 [Pedidos] Usuário logado:', currentUser.email, currentUser.uid);
      
      try {
        const allOrders: any[] = [];
        
        let q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid)
        );
        
        let snapshot = await getDocs(q);
        console.log('🔍 [Pedidos] Pedidos por userId:', snapshot.size);
        
        snapshot.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
        
        if (allOrders.length === 0 && currentUser.email) {
          q = query(
            collection(db, 'orders'),
            where('userEmail', '==', currentUser.email.toLowerCase())
          );
          snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            if (!allOrders.find(o => o.id === doc.id)) {
              allOrders.push({ id: doc.id, ...doc.data() });
            }
          });
        }
        
        if (allOrders.length === 0) {
          q = query(collection(db, 'orders'));
          snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.userId === currentUser.uid || 
                (currentUser.email && data.userEmail?.toLowerCase() === currentUser.email.toLowerCase())) {
              if (!allOrders.find(o => o.id === doc.id)) {
                allOrders.push({ id: doc.id, ...data });
              }
            }
          });
        }
        
        const ordersData: Order[] = allOrders
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
          })
          .map((data: any) => ({
            id: data.id,
            referenceId: data.referenceId || '',
            orderId: data.orderId || data.pagbankOrderId || '',
            status: data.status || 'pending',
            total: data.total || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            paymentMethod: data.paymentMethod || 'credit_card',
            items: data.items || [],
            pickupPoint: data.pickupPoint || '',
            userEmail: data.userEmail || '',
            userName: data.userName || '',
          }));
        
        setOrders(ordersData);
      } catch (error: any) {
        console.error('Erro ao buscar pedidos:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setPixQrCode(null);
    setPixText(null);
    
    if ((order.status === 'WAITING_PAYMENT' || order.status === 'pending' || order.status === 'DECLINED' || order.status === 'CANCELED') && order.paymentMethod === 'pix') {
      await fetchPixCode(order.orderId);
    }
  };

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
                  
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4 p-3 bg-white/5 rounded-xl">
                      <p className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Itens</p>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-white/70">{item.name} x{item.quantity}</span>
                            <span className="text-white/50">R$ {((item.unitAmount || 0) / 100).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-neutral-500 text-xs">+{order.items.length - 3} mais itens</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {order.pickupPoint && (
                    <div className="mb-4 text-xs">
                      <span className="text-neutral-500">Retirada em: </span>
                      <span className="text-[#22C55E] font-bold">{order.pickupPoint}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </div>
                    
                    <button
                      onClick={() => openOrderDetails(order)}
                      className="text-[#22C55E] text-xs font-bold uppercase hover:underline"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showModal && selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#1a1a1c] border border-white/10 rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusConfig(selectedOrder.status).bg} ${getStatusConfig(selectedOrder.status).color}`}>
                  {getStatusConfig(selectedOrder.status).icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Pedido #{selectedOrder.referenceId?.slice(-8) || selectedOrder.id.slice(-6)}</h2>
                  <p className="text-neutral-500 text-xs">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase mb-6 ${getStatusConfig(selectedOrder.status).bg} ${getStatusConfig(selectedOrder.status).color}`}>
                {getStatusConfig(selectedOrder.status).icon}
                {getStatusConfig(selectedOrder.status).label}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-neutral-400 text-sm">Total</span>
                  <span className="font-black text-xl text-white">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-neutral-400 text-sm">Forma de Pagamento</span>
                  <span className="text-white font-bold">
                    {selectedOrder.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                  </span>
                </div>

                {selectedOrder.pickupPoint && (
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-neutral-400 text-sm">Retirada em</span>
                    <span className="text-[#22C55E] font-bold">{selectedOrder.pickupPoint}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <p className="text-neutral-500 text-xs font-bold uppercase mb-3">Itens do Pedido</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <div>
                        <span className="text-white text-sm">{item.name}</span>
                        <span className="text-neutral-500 text-xs ml-2">x{item.quantity}</span>
                      </div>
                      <span className="text-white font-bold">R$ {((item.unitAmount || 0) / 100).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedOrder.status === 'WAITING_PAYMENT' || selectedOrder.status === 'pending' || selectedOrder.status === 'DECLINED' || selectedOrder.status === 'CANCELED') && (
                <div className="space-y-4">
                  {selectedOrder.paymentMethod === 'pix' && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-bold text-sm">Pagamento PIX Pendente</span>
                      </div>
                      
                      {pixQrCode ? (
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded-xl flex justify-center">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixText || '')}`} alt="PIX QR" className="w-full max-w-[180px]" />
                          </div>
                          
                          <button 
                            onClick={() => {
                              if (pixText) {
                                navigator.clipboard.writeText(pixText);
                                alert('Código PIX copiado!');
                              }
                            }}
                            className="w-full py-2 rounded-xl bg-white/5 text-white font-bold text-sm border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            Copiar Código PIX
                          </button>
                          
                          <button 
                            onClick={() => checkPixStatus(selectedOrder.orderId)}
                            disabled={isCheckingPix}
                            className="w-full py-2 rounded-xl bg-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors disabled:opacity-50"
                          >
                            {isCheckingPix ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {isCheckingPix ? 'Verificando...' : 'Verificar Pagamento'}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => fetchPixCode(selectedOrder.orderId)}
                          className="w-full py-2 rounded-xl bg-white/5 text-white font-bold text-sm border border-white/10"
                        >
                          Carregar QR Code
                        </button>
                      )}
                      
                      <p className="text-neutral-500 text-xs mt-3 text-center">
                        O pagamento será aprovado automaticamente após a confirmação.
                      </p>
                    </div>
                  )}

                  {selectedOrder.paymentMethod === 'credit_card' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-bold text-sm">Pagamento Recusado</span>
                      </div>
                      
                      <p className="text-neutral-400 text-sm mb-4">
                        Seu pagamento foi recusado. Você pode tentar novamente com outra forma de pagamento.
                      </p>
                      
                      <button 
                        onClick={() => {
                          const { restoreFromOrder } = useCartStore.getState();
                          const thermalBagOption = selectedOrder.thermalBag ? 'new' : undefined;
                          restoreFromOrder(selectedOrder.items, selectedOrder.pickupPoint, thermalBagOption);
                          setShowModal(false);
                          router.push('/checkout');
                        }}
                        className="w-full py-3 rounded-xl bg-[#22C55E] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#22C55E]/90 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Tentar Novamente
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.status === 'PAID' || selectedOrder.status === 'AUTHORIZED' ? (
                <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                    <span className="text-[#22C55E] font-bold text-sm">Pagamento Aprovado</span>
                  </div>
                  <p className="text-neutral-400 text-xs mt-2">
                    Seu pedido foi confirmado e está em processamento.
                  </p>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
