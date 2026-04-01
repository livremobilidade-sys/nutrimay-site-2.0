"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Calendar, Plus, ChevronLeft, Edit, Trash2, X, Check, Eye, Clock, CheckCircle2, Truck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Batch {
  id: string;
  name: string;
  deliveryDate: string;
  cutoffDate: string;
  status: string;
  orderIds: string[];
  createdAt: any;
}

const getBatchInfo = (createdAt: any) => {
  const now = new Date();
  const orderDate = createdAt?.toDate ? createdAt.toDate() : now;
  
  const day = orderDate.getDay();
  const hour = orderDate.getHours();
  
  const tuesday14 = new Date(orderDate);
  tuesday14.setHours(14, 0, 0, 0);
  
  if (day === 2 && hour < 14) {
    const wednesday = new Date(orderDate);
    wednesday.setDate(wednesday.getDate() + (3 - wednesday.getDay() + 7) % 7);
    return {
      batchName: `Quarta ${wednesday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
      deliveryDay: 'Quarta',
      isThisWeek: true
    };
  }
  
  const nextWednesday = new Date(orderDate);
  if (day === 2 && hour >= 14) {
    nextWednesday.setDate(nextWednesday.getDate() + 7);
  } else if (day > 2 || day === 3 || day === 4 || day === 5 || day === 6) {
    nextWednesday.setDate(nextWednesday.getDate() + ((3 - nextWednesday.getDay() + 7) % 7 || 7));
  }
  
  return {
    batchName: `Quarta ${nextWednesday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
    deliveryDay: 'Próxima Quarta',
    isThisWeek: false
  };
};

interface Order {
  id: string;
  referenceId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  total: number;
  status: string;
  items: any[];
  pickupPoint: string;
  delivered?: boolean;
  deliveredAt?: any;
  batchId?: string;
}

export default function AdminBatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    deliveryDate: '',
    cutoffDate: ''
  });

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
      const qBatches = query(collection(db, 'batches'), orderBy('deliveryDate', 'desc'));
      const batchesSnap = await getDocs(qBatches);
      const batchesData: Batch[] = [];
      
      batchesSnap.forEach(doc => {
        batchesData.push({ id: doc.id, ...doc.data() } as Batch);
      });
      setBatches(batchesData);

      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnap = await getDocs(qOrders);
      const ordersData: Order[] = [];
      
      ordersSnap.forEach(doc => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.deliveryDate) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'batches', editingId), {
          name: formData.name,
          deliveryDate: formData.deliveryDate,
          cutoffDate: formData.cutoffDate || null,
        });
      } else {
        await addDoc(collection(db, 'batches'), {
          name: formData.name,
          deliveryDate: formData.deliveryDate,
          cutoffDate: formData.cutoffDate || null,
          status: 'pending',
          orderIds: [],
          createdAt: new Date(),
        });
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', deliveryDate: '', cutoffDate: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  const generateBatchCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const calculateNextDeliveryDate = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    
    // Total minutes past Tuesday 14:00
    const tuesday14 = new Date(now);
    tuesday14.setHours(14, 0, 0, 0);
    
    const isBeforeTuesday14 = day === 2 && (hour < 14 || (hour === 14 && minutes < 1));
    const isBeforeCutoff = day < 2 || (day === 2 && hour < 14);
    
    let deliveryDate = new Date(now);
    
    if (isBeforeCutoff) {
      // Delivery this Wednesday
      const daysUntilWednesday = (3 - day + 7) % 7 || 7;
      deliveryDate.setDate(now.getDate() + daysUntilWednesday);
    } else {
      // Delivery next Wednesday
      const daysUntilWednesday = (3 - day + 7) % 7;
      deliveryDate.setDate(now.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));
    }
    
    deliveryDate.setHours(0, 0, 0, 0);
    
    return deliveryDate.toISOString().split('T')[0];
  };

  const createBatchAutomatically = async () => {
    const unassignedOrders = getUnassignedOrders();
    
    if (unassignedOrders.length === 0) {
      alert('Não há pedidos sem lote para criar um novo lote!');
      return;
    }

    const batchCode = generateBatchCode();
    const deliveryDate = calculateNextDeliveryDate();
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const deliveryDayName = dayNames[new Date(deliveryDate).getDay()];
    
    const batchName = `${deliveryDayName} - ${batchCode}`;
    
    if (!confirm(`Criar lote "${batchName}" para ${new Date(deliveryDate).toLocaleDateString('pt-BR')} com ${unassignedOrders.length} pedidos?`)) {
      return;
    }

    try {
      const batchDoc = await addDoc(collection(db, 'batches'), {
        name: batchName,
        code: batchCode,
        deliveryDate: deliveryDate,
        cutoffDate: new Date().toISOString(),
        status: 'pending',
        orderIds: unassignedOrders.map(o => o.id),
        createdAt: new Date(),
      });

      // Assign all orders to this batch
      for (const order of unassignedOrders) {
        await updateDoc(doc(db, 'orders', order.id), {
          batchId: batchDoc.id,
          batchName: batchName,
        });
      }

      alert(`Lote "${batchName}" criado com ${unassignedOrders.length} pedidos!`);
      fetchData();
    } catch (error) {
      console.error('Error creating batch automatically:', error);
      alert('Erro ao criar lote automaticamente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote?')) return;
    
    try {
      await deleteDoc(doc(db, 'batches', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const toggleBatchStatus = async (batch: Batch) => {
    const newStatus = batch.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(doc(db, 'batches', batch.id), {
        status: newStatus,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating batch status:', error);
    }
  };

  const assignOrdersToBatch = async (batchId: string, orderIds: string[]) => {
    try {
      for (const orderId of orderIds) {
        await updateDoc(doc(db, 'orders', orderId), {
          batchId: batchId,
        });
      }
      fetchData();
      alert(`${orderIds.length} pedidos atribuídos ao lote!`);
    } catch (error) {
      console.error('Error assigning orders:', error);
    }
  };

  const openBatchDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowDetailModal(true);
  };

  const getOrdersInBatch = (batchOrderIds: string[]) => {
    return orders.filter(o => batchOrderIds?.includes(o.id));
  };

  const getUnassignedOrders = () => {
    return orders.filter(o => 
      !o.batchId && (o.status === 'PAID' || o.status === 'AUTHORIZED')
    );
  };

  const getOrdersByBatch = (batchId: string) => {
    return orders.filter(o => o.batchId === batchId && (o.status === 'PAID' || o.status === 'AUTHORIZED'));
  };

  const generateBatchPDF = (batch: Batch) => {
    const batchOrders = getOrdersInBatch(batch.orderIds || []);
    const deliveredOrders = batchOrders.filter(o => o.delivered);
    const pendingOrders = batchOrders.filter(o => !o.delivered);

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Lote de Entrega - ${batch.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Data de Entrega: ${new Date(batch.deliveryDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`, 14, 30);
    doc.text(`Total de Pedidos: ${batchOrders.length}`, 14, 36);
    doc.text(`Entregues: ${deliveredOrders.length}`, 14, 42);
    doc.text(`Pendentes: ${pendingOrders.length}`, 14, 48);

    const totalValue = batchOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2).replace('.', ',')}`, 14, 54);

    const groupedByPickup = batchOrders.reduce((acc, order) => {
      const point = order.pickupPoint || 'Não definido';
      if (!acc[point]) acc[point] = [];
      acc[point].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    let currentY = 65;

    Object.entries(groupedByPickup).forEach(([pickupPoint, pointOrders]) => {
      doc.setFontSize(12);
      doc.text(`${pickupPoint} (${pointOrders.length} pedidos)`, 14, currentY);
      currentY += 6;
      
      const pointData = pointOrders.map(order => [
        `#${order.referenceId?.slice(-6) || order.id.slice(-6)}`,
        order.userName || order.userEmail || '-',
        order.userPhone || '-',
        order.delivered ? '✓' : '○',
        `R$ ${order.total?.toFixed(2).replace('.', ',')}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Pedido', 'Cliente', 'Telefone', 'Status', 'Valor']],
        body: pointData,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        styles: { fontSize: 9 },
      });

      currentY = (pointOrders.length * 7) + 25;
    });

    const fileName = `lote-${batch.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);
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
            <h1 className="text-2xl font-black tracking-tighter uppercase">Lotes de Entrega</h1>
          </div>
          <button 
            onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', deliveryDate: '', cutoffDate: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase rounded-xl hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Lote
          </button>
          <button 
            onClick={createBatchAutomatically}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-xl hover:scale-105 transition-transform"
          >
            <Calendar className="w-4 h-4" />
            Criar Lote Automático
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Total de Lotes</p>
            <p className="text-3xl font-black">{batches.length}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <p className="text-amber-400 text-xs font-bold uppercase mb-1">Pendentes</p>
            <p className="text-3xl font-black text-amber-400">
              {batches.filter(b => b.status === 'pending').length}
            </p>
          </div>
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-6">
            <p className="text-[#22C55E] text-xs font-bold uppercase mb-1">Concluídos</p>
            <p className="text-3xl font-black text-[#22C55E]">
              {batches.filter(b => b.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Pedidos sem Lote</p>
            <p className="text-3xl font-black">{getUnassignedOrders().length}</p>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-amber-400">Próxima Entrega</h3>
                <p className="text-neutral-400 text-sm">
                  {new Date(calculateNextDeliveryDate()).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
              </div>
            </div>
            <button 
              onClick={createBatchAutomatically}
              disabled={getUnassignedOrders().length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              Criar Lote Agora ({getUnassignedOrders().length} pedidos)
            </button>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhum lote criado</h2>
            <p className="text-neutral-500 mb-6">Crie lotes para controlar as entregas.</p>
            <button 
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', deliveryDate: '', cutoffDate: '' }); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-full hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Criar Lote
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {batches.map((batch, index) => {
              const batchOrders = getOrdersByBatch(batch.id);
              const totalValue = batchOrders.reduce((acc, o) => acc + (o.total || 0), 0);
              
              return (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        batch.status === 'completed' ? 'bg-[#22C55E]/10' : 'bg-amber-500/10'
                      }`}>
                        <Calendar className={`w-6 h-6 ${
                          batch.status === 'completed' ? 'text-[#22C55E]' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{batch.name}</p>
                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                          <Truck className="w-4 h-4" />
                          <span>Entrega: {new Date(batch.deliveryDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs font-bold uppercase">Pedidos</p>
                        <p className="text-white font-black text-xl">{batchOrders.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs font-bold uppercase">Valor</p>
                        <p className="text-white font-black">R$ {totalValue.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div 
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer ${
                          batch.status === 'completed' 
                            ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                        onClick={() => toggleBatchStatus(batch)}
                      >
                        {batch.status === 'completed' ? 'Concluído' : 'Pendente'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => openBatchDetails(batch)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Ver Detalhes</span>
                    </button>
                    <button 
                      onClick={() => generateBatchPDF(batch)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Gerar PDF</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(batch.id);
                        setFormData({ 
                          name: batch.name, 
                          deliveryDate: batch.deliveryDate.split('T')[0],
                          cutoffDate: batch.cutoffDate?.split('T')[0] || ''
                        });
                        setShowModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(batch.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-black mb-2">{selectedBatch.name}</h2>
              <p className="text-neutral-500 text-sm mb-6">
                Entrega: {new Date(selectedBatch.deliveryDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>

              <button 
                onClick={() => generateBatchPDF(selectedBatch)}
                className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm rounded-xl mb-6 hover:scale-105 transition-transform"
              >
                <Users className="w-4 h-4" />
                Baixar Relatório PDF
              </button>

              <div className="space-y-3">
                {getOrdersByBatch(selectedBatch.id).map(order => (
                  <div 
                    key={order.id}
                    className={`p-4 rounded-xl border ${
                      order.delivered 
                        ? 'bg-[#22C55E]/5 border-[#22C55E]/20' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-white">#{order.referenceId?.slice(-6)}</p>
                        <p className="text-neutral-500 text-sm">{order.userName || order.userEmail}</p>
                        <p className="text-neutral-500 text-xs">{order.pickupPoint}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-white">R$ {order.total?.toFixed(2).replace('.', ',')}</p>
                        <button 
                          onClick={async () => {
                            await updateDoc(doc(db, 'orders', order.id), {
                              delivered: !order.delivered,
                              deliveredAt: !order.delivered ? new Date() : null,
                            });
                            fetchData();
                          }}
                          className={`flex items-center gap-1 text-xs font-bold uppercase mt-2 ${
                            order.delivered ? 'text-[#22C55E]' : 'text-amber-400'
                          }`}
                        >
                          {order.delivered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Entregue
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pendente
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {getOrdersByBatch(selectedBatch.id).length === 0 && (
                <p className="text-neutral-500 text-center py-8">Nenhum pedido neste lote.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                {editingId ? 'Editar Lote' : 'Novo Lote'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Nome do Lote</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Quarta - 02/04"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Data de Entrega</label>
                  <input 
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
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
                  disabled={!formData.name || !formData.deliveryDate}
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
