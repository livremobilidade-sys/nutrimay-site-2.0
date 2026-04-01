"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Calendar, Plus, Users, MapPin, ChevronLeft, Edit, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryGroup {
  id: string;
  name: string;
  date: string;
  status: string;
  orderIds: string[];
  createdAt: string;
}

export default function AdminDeliveriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<DeliveryGroup[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', date: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !['evari.may@gmail.com', 'evaristosilvalima@gmail.com'].includes(user.email || '')) {
        router.push('/');
        return;
      }
      
      fetchData();
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      // Fetch delivery groups
      const qDeliveries = query(collection(db, 'deliveryGroups'), orderBy('date', 'desc'));
      const deliveriesSnap = await getDocs(qDeliveries);
      const deliveriesData: DeliveryGroup[] = [];
      
      deliveriesSnap.forEach(doc => {
        deliveriesData.push({ id: doc.id, ...doc.data() } as DeliveryGroup);
      });
      setDeliveries(deliveriesData);

      // Fetch all orders for assignment
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnap = await getDocs(qOrders);
      const ordersData: any[] = [];
      
      ordersSnap.forEach(doc => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.date) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'deliveryGroups', editingId), {
          name: formData.name,
          date: formData.date,
        });
      } else {
        await addDoc(collection(db, 'deliveryGroups'), {
          name: formData.name,
          date: formData.date,
          status: 'pending',
          orderIds: [],
          createdAt: new Date(),
        });
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', date: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving delivery:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entrega?')) return;
    
    try {
      await deleteDoc(doc(db, 'deliveryGroups', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting delivery:', error);
    }
  };

  const getOrdersInDelivery = (orderIds: string[]) => {
    return orders.filter(o => orderIds?.includes(o.id));
  };

  const getPendingOrders = () => {
    // Get orders that are PAID but not assigned to any delivery
    const assignedOrderIds = deliveries.flatMap(d => d.orderIds || []);
    return orders.filter(o => 
      (o.status === 'PAID' || o.status === 'AUTHORIZED') && 
      !assignedOrderIds.includes(o.id)
    );
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
        <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">Voltar</span>
            </Link>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Entregas</h1>
          </div>
          <button 
            onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', date: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-xl hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Nova Entrega
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Total de Entregas</p>
            <p className="text-3xl font-black">{deliveries.length}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <p className="text-amber-400 text-xs font-bold uppercase mb-1">Pendentes</p>
            <p className="text-3xl font-black text-amber-400">
              {deliveries.filter(d => d.status === 'pending').length}
            </p>
          </div>
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-6">
            <p className="text-[#22C55E] text-xs font-bold uppercase mb-1">Concluídas</p>
            <p className="text-3xl font-black text-[#22C55E]">
              {deliveries.filter(d => d.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Pending Orders to Assign */}
        {getPendingOrders().length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-amber-400">Pedidos esperando entrega</h3>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Você tem {getPendingOrders().length} pedidos pagos que precisam ser adicionados a uma entrega.
            </p>
            <div className="flex flex-wrap gap-2">
              {getPendingOrders().slice(0, 5).map(order => (
                <span key={order.id} className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  #{order.referenceId?.slice(-6)} - R$ {order.total?.toFixed(2)}
                </span>
              ))}
              {getPendingOrders().length > 5 && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  +{getPendingOrders().length - 5} mais
                </span>
              )}
            </div>
          </div>
        )}

        {/* Delivery Groups */}
        {deliveries.length === 0 ? (
          <div className="text-center py-20">
            <Truck className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma entrega criada</h2>
            <p className="text-neutral-500 mb-6">Crie grupos de entregas para organizar as entregas.</p>
            <button 
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', date: '' }); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-full hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Criar Entrega
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {deliveries.map((delivery, index) => {
              const deliveryOrders = getOrdersInDelivery(delivery.orderIds || []);
              const totalValue = deliveryOrders.reduce((acc, o) => acc + (o.total || 0), 0);
              
              return (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        delivery.status === 'completed' ? 'bg-[#22C55E]/10' : 'bg-amber-500/10'
                      }`}>
                        <Truck className={`w-6 h-6 ${
                          delivery.status === 'completed' ? 'text-[#22C55E]' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{delivery.name}</p>
                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(delivery.date).toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            day: '2-digit', 
                            month: 'long' 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs font-bold uppercase">Pedidos</p>
                        <p className="text-white font-black text-xl">{deliveryOrders.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs font-bold uppercase">Valor</p>
                        <p className="text-white font-black">R$ {totalValue.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        delivery.status === 'completed' 
                          ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {delivery.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </div>
                    </div>
                  </div>
                  
                  {deliveryOrders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-neutral-500 text-xs font-bold uppercase mb-3">Pedidos nesta entrega:</p>
                      <div className="flex flex-wrap gap-2">
                        {deliveryOrders.map(order => (
                          <span key={order.id} className="px-3 py-1.5 bg-white/5 rounded-lg text-xs">
                            <span className="text-white font-bold">#{order.referenceId?.slice(-6)}</span>
                            <span className="text-neutral-400 ml-2">{order.userName || order.userEmail}</span>
                            <span className="text-[#22C55E] ml-2">R$ {order.total?.toFixed(2)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => {
                        setEditingId(delivery.id);
                        setFormData({ name: delivery.name, date: delivery.date.split('T')[0] });
                        setShowModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(delivery.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Excluir</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-black mb-6">
                {editingId ? 'Editar Entrega' : 'Nova Entrega'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Nome da Entrega</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Segunda-feira - ABC"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Data de Entrega</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#22C55E]/30 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold uppercase text-sm hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.name || !formData.date}
                  className="flex-1 py-3 bg-[#22C55E] text-black font-bold uppercase text-sm rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}