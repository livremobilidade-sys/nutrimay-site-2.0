"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, orderBy, addDoc, doc, updateDoc, deleteDoc, where, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Calendar, Plus, ChevronLeft, Edit, Trash2, X, Check, Eye, Clock, CheckCircle2, Truck, Users, PlusCircle, MinusCircle, Search, MapPin } from 'lucide-react';
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
  code?: string;
}

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
  createdAt: any;
}

const getDeliveryDateForOrder = (orderDate: Date): Date => {
  const day = orderDate.getDay();
  const hour = orderDate.getHours();
  const minute = orderDate.getMinutes();
  
  const deliveryDate = new Date(orderDate);
  deliveryDate.setHours(0, 0, 0, 0);
  
  // Day 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  
  // Tuesday before 14:00 → deliver THIS Wednesday (day 3)
  const isBeforeCutoff = day < 2 || (day === 2 && (hour < 14 || (hour === 14 && minute === 0)));
  
  if (isBeforeCutoff) {
    if (day === 3) {
      deliveryDate.setDate(orderDate.getDate());
    } else if (day === 2) {
      deliveryDate.setDate(orderDate.getDate() + 1);
    } else {
      const daysUntilWednesday = (3 - day + 7) % 7;
      deliveryDate.setDate(orderDate.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));
    }
  } else {
    // Tuesday after 14:00 OR any other day → next Wednesday
    if (day === 3) {
      deliveryDate.setDate(orderDate.getDate() + 7);
    } else if (day === 2) {
      deliveryDate.setDate(orderDate.getDate() + 8);
    } else {
      const daysUntilWednesday = (3 - day + 7) % 7;
      deliveryDate.setDate(orderDate.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));
    }
  }
  
  return deliveryDate;
};

const generateBatchCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getNextDeliveryDate = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  const isBeforeCutoff = day < 2 || (day === 2 && (hour < 14 || (hour === 14 && minute === 0)));
  
  const deliveryDate = new Date(now);
  deliveryDate.setHours(0, 0, 0, 0);
  
  if (isBeforeCutoff) {
    if (day === 3) {
      deliveryDate.setDate(now.getDate());
    } else if (day === 2) {
      deliveryDate.setDate(now.getDate() + 1);
    } else {
      const daysUntilWednesday = (3 - day + 7) % 7;
      deliveryDate.setDate(now.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));
    }
  } else {
    if (day === 3) {
      deliveryDate.setDate(now.getDate() + 7);
    } else if (day === 2) {
      deliveryDate.setDate(now.getDate() + 8);
    } else {
      const daysUntilWednesday = (3 - day + 7) % 7;
      deliveryDate.setDate(now.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));
    }
  }
  
  return deliveryDate;
};

const getNextCutoffDate = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  const isBeforeCutoff = day < 2 || (day === 2 && (hour < 14 || (hour === 14 && minute === 0)));
  
  const cutoffDate = new Date(now);
  
  if (isBeforeCutoff) {
    if (day === 2) {
      cutoffDate.setHours(14, 0, 0, 0);
    } else {
      const daysUntilNextTuesday = (2 - day + 7) % 7 || 7;
      cutoffDate.setDate(now.getDate() + daysUntilNextTuesday);
      cutoffDate.setHours(14, 0, 0, 0);
    }
  } else {
    if (day === 2) {
      cutoffDate.setDate(now.getDate() + 7);
      cutoffDate.setHours(14, 0, 0, 0);
    } else {
      const daysUntilNextTuesday = (2 - day + 7) % 7 || 7;
      cutoffDate.setDate(now.getDate() + daysUntilNextTuesday);
      cutoffDate.setHours(14, 0, 0, 0);
    }
  }
  
  return cutoffDate;
};

export default function AdminBatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    deliveryDate: '',
    cutoffDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote? Os pedidos ficarão sem lote.')) return;
    
    try {
      const batch = batches.find(b => b.id === id);
      if (batch?.orderIds) {
        for (const orderId of batch.orderIds) {
          await updateDoc(doc(db, 'orders', orderId), {
            batchId: null,
            batchName: null,
          });
        }
      }
      
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

  const removeOrderFromBatch = async (orderId: string, batchId: string) => {
    if (!confirm('Remover este pedido do lote?')) return;
    
    try {
      const batch = batches.find(b => b.id === batchId);
      const newOrderIds = batch?.orderIds?.filter(id => id !== orderId) || [];
      
      await updateDoc(doc(db, 'batches', batchId), {
        orderIds: newOrderIds,
      });
      
      await updateDoc(doc(db, 'orders', orderId), {
        batchId: null,
        batchName: null,
      });
      
      if (selectedBatch && selectedBatch.id === batchId) {
        setSelectedBatch({ ...selectedBatch, orderIds: newOrderIds });
      }
      
      fetchData();
    } catch (error) {
      console.error('Error removing order from batch:', error);
    }
  };

  const addOrderToBatch = async (orderId: string) => {
    if (!selectedBatch) return;
    
    try {
      const currentOrderIds = selectedBatch.orderIds || [];
      const newOrderIds = [...currentOrderIds, orderId];
      
      await updateDoc(doc(db, 'batches', selectedBatch.id), {
        orderIds: newOrderIds,
      });
      
      await updateDoc(doc(db, 'orders', orderId), {
        batchId: selectedBatch.id,
        batchName: selectedBatch.name,
      });
      
      setSelectedBatch({ ...selectedBatch, orderIds: newOrderIds });
      setShowAddOrderModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding order to batch:', error);
    }
  };

  const getOrdersInBatch = (batchOrderIds: string[]) => {
    return orders.filter(o => batchOrderIds?.includes(o.id));
  };

  const getOrdersGroupedByPickupPoint = (batchOrderIds: string[]) => {
    const batchOrders = getOrdersInBatch(batchOrderIds);
    const grouped: Record<string, typeof batchOrders> = {};
    
    batchOrders.forEach(order => {
      const pickupPoint = order.pickupPoint || 'Sem local definido';
      if (!grouped[pickupPoint]) {
        grouped[pickupPoint] = [];
      }
      grouped[pickupPoint].push(order);
    });
    
    return grouped;
  };

  const getUnassignedOrders = () => {
    const nextDelivery = getNextDeliveryDate();
    return orders.filter(o => {
      if (o.batchId || (o.status !== 'PAID' && o.status !== 'AUTHORIZED')) return false;
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
      const orderDeliveryDate = getDeliveryDateForOrder(orderDate);
      return orderDeliveryDate.toDateString() === nextDelivery.toDateString();
    });
  };

  const getOrdersByBatch = (batchId: string) => {
    return orders.filter(o => o.batchId === batchId && (o.status === 'PAID' || o.status === 'AUTHORIZED'));
  };

  const getAvailableOrdersForBatch = () => {
    const currentBatchOrderIds = selectedBatch?.orderIds || [];
    const deliveryDate = selectedBatch?.deliveryDate ? new Date(selectedBatch.deliveryDate + 'T00:00:00') : null;
    
    if (!deliveryDate) return [];
    
    return orders.filter(o => {
      const isPaid = o.status === 'PAID' || o.status === 'AUTHORIZED';
      const notInBatch = !currentBatchOrderIds.includes(o.id);
      
      if (!isPaid || !notInBatch) return false;
      
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
      const orderDeliveryDate = getDeliveryDateForOrder(orderDate);
      
      const sameWeek = deliveryDate.toDateString() === orderDeliveryDate.toDateString();
      
      return sameWeek;
    });
  };

  const createBatchAutomatically = async () => {
    const nextDelivery = getNextDeliveryDate();
    const nextCutoff = getNextCutoffDate();
    const batchCode = generateBatchCode();
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const deliveryDayName = dayNames[nextDelivery.getDay()];
    
    const batchName = `${deliveryDayName} - ${batchCode}`;
    
    const unassignedOrders = getUnassignedOrders();
    const ordersForThisDelivery = unassignedOrders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
      const orderDeliveryDate = getDeliveryDateForOrder(orderDate);
      return orderDeliveryDate.toDateString() === nextDelivery.toDateString();
    });
    
    if (ordersForThisDelivery.length === 0) {
      alert(`Não há pedidos para criar lote de ${nextDelivery.toLocaleDateString('pt-BR')}`);
      return;
    }

    if (!confirm(`Criar lote "${batchName}" para ${nextDelivery.toLocaleDateString('pt-BR')} com ${ordersForThisDelivery.length} pedidos?`)) {
      return;
    }

    try {
      const batchDoc = await addDoc(collection(db, 'batches'), {
        name: batchName,
        code: batchCode,
        deliveryDate: nextDelivery.toISOString().split('T')[0],
        cutoffDate: nextCutoff.toISOString(),
        status: 'pending',
        orderIds: ordersForThisDelivery.map(o => o.id),
        createdAt: new Date(),
      });

      for (const order of ordersForThisDelivery) {
        await updateDoc(doc(db, 'orders', order.id), {
          batchId: batchDoc.id,
          batchName: batchName,
        });
      }

      alert(`Lote "${batchName}" criado com ${ordersForThisDelivery.length} pedidos!`);
      fetchData();
    } catch (error) {
      console.error('Error creating batch automatically:', error);
      alert('Erro ao criar lote automaticamente');
    }
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

  const openBatchDetails = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextDelivery = getNextDeliveryDate();
  const nextCutoff = getNextCutoffDate();

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
          <div className="flex gap-3">
            <button 
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', deliveryDate: '', cutoffDate: '' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase rounded-xl hover:bg-white/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Lote
            </button>
            <button 
              onClick={createBatchAutomatically}
              disabled={getUnassignedOrders().length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              Criar Lote Automático
            </button>
          </div>
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
            <div className="flex items-center gap-6">
              <div>
                <p className="text-amber-400 text-xs font-bold uppercase mb-1">Próxima Entrega</p>
                <p className="text-white font-black text-lg">
                  {nextDelivery.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-amber-400 text-xs font-bold uppercase mb-1">Corte (até)</p>
                <p className="text-white font-bold">
                  {nextCutoff.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })} às 14:00
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
              onClick={createBatchAutomatically}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-full hover:scale-105 transition-transform"
            >
              <Calendar className="w-4 h-4" />
              Criar Primeiro Lote
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
              className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <button 
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black mb-1">{selectedBatch.name}</h2>
                  <p className="text-neutral-500 text-sm">
                    Entrega: {new Date(selectedBatch.deliveryDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedBatch(selectedBatch);
                    setShowAddOrderModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm rounded-xl"
                >
                  <PlusCircle className="w-4 h-4" />
                  Adicionar Pedido
                </button>
              </div>

              <button 
                onClick={() => generateBatchPDF(selectedBatch)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl mb-6 hover:bg-white/10 transition-colors w-full justify-center"
              >
                <Users className="w-4 h-4" />
                Baixar Relatório PDF
              </button>

              <div className="space-y-6">
                {Object.entries(getOrdersGroupedByPickupPoint(selectedBatch.orderIds || [])).map(([pickupPoint, orders]) => (
                  <div key={pickupPoint}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                      <MapPin className="w-4 h-4 text-[#22C55E]" />
                      <p className="text-[#22C55E] font-bold text-sm">{pickupPoint}</p>
                      <p className="text-neutral-500 text-xs ml-auto">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="space-y-2">
                      {orders.map(order => (
                        <div 
                          key={order.id}
                          className={`p-4 rounded-xl border ${
                            order.delivered 
                              ? 'bg-[#22C55E]/5 border-[#22C55E]/20' 
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-bold text-white">#{order.referenceId?.slice(-6)}</p>
                                <p className="text-neutral-500 text-xs">
                                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </p>
                              </div>
                              <p className="text-neutral-500 text-sm">{order.userName || order.userEmail}</p>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
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
                              <button 
                                onClick={() => removeOrderFromBatch(order.id, selectedBatch.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remover do lote"
                              >
                                <MinusCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {getOrdersInBatch(selectedBatch.orderIds || []).length === 0 && (
                <p className="text-neutral-500 text-center py-8">Nenhum pedido neste lote.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Order Modal */}
      <AnimatePresence>
        {showAddOrderModal && selectedBatch && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddOrderModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <button 
                onClick={() => setShowAddOrderModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-black mb-2">Adicionar Pedido ao Lote</h2>
              <p className="text-neutral-500 text-sm mb-6">
                Adicionando ao lote: {selectedBatch.name}
              </p>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input 
                  type="text"
                  placeholder="Buscar pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getAvailableOrdersForBatch()
                  .filter(o => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    return (
                      o.referenceId?.toLowerCase().includes(search) ||
                      o.userName?.toLowerCase().includes(search) ||
                      o.userEmail?.toLowerCase().includes(search)
                    );
                  })
                  .map(order => (
                    <div 
                      key={order.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-white">#{order.referenceId?.slice(-6)}</p>
                        <p className="text-neutral-500 text-xs">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </p>
                        <p className="text-neutral-400 text-sm">{order.userName || order.userEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">R$ {order.total?.toFixed(2).replace('.', ',')}</p>
                        <button 
                          onClick={() => addOrderToBatch(order.id)}
                          className="flex items-center gap-1 text-xs text-[#22C55E] font-bold uppercase mt-1"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {getAvailableOrdersForBatch().filter(o => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (
                  o.referenceId?.toLowerCase().includes(search) ||
                  o.userName?.toLowerCase().includes(search) ||
                  o.userEmail?.toLowerCase().includes(search)
                );
              }).length === 0 && (
                <p className="text-neutral-500 text-center py-8">Nenhum pedido disponível para adicionar.</p>
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
                {editingId ? 'Editar Lote' : 'Novo Lote (Manual)'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Nome do Lote</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Quarta - ABC123"
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

