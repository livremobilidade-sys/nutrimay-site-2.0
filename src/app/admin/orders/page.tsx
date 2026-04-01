"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Search, Filter, CheckCircle2, Clock, XCircle, AlertCircle, Eye, RefreshCw, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

type OrderStatus = 'PAID' | 'AUTHORIZED' | 'WAITING_PAYMENT' | 'IN_ANALYSIS' | 'DECLINED' | 'CANCELED' | 'PROCESSING' | 'pending';

interface Order {
  id: string;
  referenceId: string;
  orderId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  paymentMethod: string;
  userEmail: string;
  userName: string;
  items: any[];
  pickupPoint: string;
}

const getStatusConfig = (status: string) => {
  const s = status?.toUpperCase() || 'PENDING';
  
  if (s === 'PAID' || s === 'AUTHORIZED') {
    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22C55E]/10 border-[#22C55E]/20',
      label: 'Aprovado',
    };
  }
  if (s === 'WAITING_PAYMENT' || s === 'IN_ANALYSIS' || s === 'PROCESSING' || s === 'PENDING') {
    return {
      icon: <Clock className="w-4 h-4" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      label: 'Em Análise',
    };
  }
  if (s === 'DECLINED' || s === 'CANCELED') {
    return {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Recusado',
    };
  }
  return {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-neutral-400',
    bg: 'bg-neutral-500/10 border-neutral-500/20',
    label: 'Pendente',
  };
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !['evari.may@gmail.com', 'evaristosilvalima@gmail.com'].includes(user.email || '')) {
        router.push('/');
        return;
      }
      
      fetchOrders();
    });

    return () => unsubscribe();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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
            userEmail: data.userEmail || '',
            userName: data.userName || '',
            items: data.items || [],
            pickupPoint: data.pickupPoint || '',
          });
        });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus as any } : o
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || 
      (filter === 'paid' && (order.status === 'PAID' || order.status === 'AUTHORIZED')) ||
      (filter === 'pending' && (order.status === 'WAITING_PAYMENT' || order.status === 'IN_ANALYSIS' || order.status === 'PROCESSING')) ||
      (filter === 'declined' && (order.status === 'DECLINED' || order.status === 'CANCELED'));
    
    const matchesSearch = !search || 
      order.referenceId?.toLowerCase().includes(search.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      order.userName?.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'PAID' || o.status === 'AUTHORIZED').length,
    pending: orders.filter(o => o.status === 'WAITING_PAYMENT' || o.status === 'IN_ANALYSIS' || o.status === 'PROCESSING').length,
    declined: orders.filter(o => o.status === 'DECLINED' || o.status === 'CANCELED').length,
    revenue: orders.filter(o => o.status === 'PAID' || o.status === 'AUTHORIZED').reduce((acc, o) => acc + o.total, 0),
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
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 py-6">
        <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Voltar</span>
            </Link>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Pedidos</h1>
          </div>
          <button 
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Atualizar</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Total de Pedidos</p>
            <p className="text-3xl font-black">{stats.total}</p>
          </div>
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-6">
            <p className="text-[#22C55E] text-xs font-bold uppercase mb-1">Aprovados</p>
            <p className="text-3xl font-black text-[#22C55E]">{stats.paid}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <p className="text-amber-400 text-xs font-bold uppercase mb-1">Pendentes</p>
            <p className="text-3xl font-black text-amber-400">{stats.pending}</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <p className="text-red-400 text-xs font-bold uppercase mb-1">Recusados</p>
            <p className="text-3xl font-black text-red-400">{stats.declined}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Faturamento</p>
            <p className="text-3xl font-black">R$ {stats.revenue.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text"
              placeholder="Buscar por cliente, e-mail ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#22C55E]/30 outline-none"
            >
              <option value="all">Todos</option>
              <option value="paid">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="declined">Recusados</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h2>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-6 text-neutral-500 text-xs font-bold uppercase">Pedido</th>
                  <th className="text-left p-6 text-neutral-500 text-xs font-bold uppercase">Cliente</th>
                  <th className="text-left p-6 text-neutral-500 text-xs font-bold uppercase">Método</th>
                  <th className="text-left p-6 text-neutral-500 text-xs font-bold uppercase">Valor</th>
                  <th className="text-left p-6 text-neutral-500 text-xs font-bold uppercase">Data</th>
                  <th className="text-left p-6 text-neutral-500 text-xs font-bold uppercase">Status</th>
                  <th className="text-right p-6 text-neutral-500 text-xs font-bold uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  
                  return (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-6">
                        <p className="font-bold text-white text-sm">#{order.referenceId?.slice(-8) || order.id.slice(-6)}</p>
                        <p className="text-neutral-500 text-xs">{order.orderId?.slice(-12)}</p>
                      </td>
                      <td className="p-6">
                        <p className="font-bold text-white text-sm">{order.userName || 'Não identificado'}</p>
                        <p className="text-neutral-500 text-xs">{order.userEmail}</p>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold uppercase text-white/60">
                          {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-white">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-white/60 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </div>
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 outline-none hover:border-white/20 cursor-pointer"
                          >
                            <option value="PROCESSING">Processando</option>
                            <option value="WAITING_PAYMENT">Aguardando</option>
                            <option value="PAID">Pago</option>
                            <option value="AUTHORIZED">Autorizado</option>
                            <option value="IN_ANALYSIS">Em Análise</option>
                            <option value="DECLINED">Recusado</option>
                            <option value="CANCELED">Cancelado</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Ver</span>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-black mb-6">Pedido #{selectedOrder.referenceId?.slice(-8)}</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Status</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase ${getStatusConfig(selectedOrder.status).bg} ${getStatusConfig(selectedOrder.status).color}`}>
                  {getStatusConfig(selectedOrder.status).icon}
                  {getStatusConfig(selectedOrder.status).label}
                </div>
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Data</p>
                <p className="text-white font-medium">
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

            <div className="space-y-4 mb-8">
              <p className="text-neutral-500 text-xs font-bold uppercase">Itens do Pedido</p>
              {selectedOrder.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-neutral-500 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-black text-white">R$ {((item.unitAmount || 0) / 100).toFixed(2).replace('.', ',')}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-neutral-500 text-xs font-bold uppercase">Total</p>
                <p className="text-3xl font-black text-[#22C55E]">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
