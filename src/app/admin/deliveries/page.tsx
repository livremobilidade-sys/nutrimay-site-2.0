"use client";

import { useEffect, useState, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs, orderBy, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Calendar, Plus, Users, MapPin, ChevronLeft, Edit, Trash2, X, Check, Eye, CheckCircle2, XCircle, Clock, FileText, Download, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  responsibleName: string;
  responsiblePhone: string;
  instructions: string;
  active: boolean;
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
  deliveryStatus?: string;
  createdAt: any;
}

export default function AdminDeliveriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    responsibleName: '',
    responsiblePhone: '',
    instructions: '',
    active: true
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
      const qPickupPoints = query(collection(db, 'pickupPoints'), orderBy('name', 'asc'));
      const pickupSnap = await getDocs(qPickupPoints);
      const pickupData: PickupPoint[] = [];
      
      pickupSnap.forEach(doc => {
        pickupData.push({ id: doc.id, ...doc.data() } as PickupPoint);
      });
      setPickupPoints(pickupData);

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
    if (!formData.name || !formData.address) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'pickupPoints', editingId), {
          name: formData.name,
          address: formData.address,
          responsibleName: formData.responsibleName,
          responsiblePhone: formData.responsiblePhone,
          instructions: formData.instructions,
          active: formData.active,
        });
      } else {
        await addDoc(collection(db, 'pickupPoints'), {
          name: formData.name,
          address: formData.address,
          responsibleName: formData.responsibleName,
          responsiblePhone: formData.responsiblePhone,
          instructions: formData.instructions,
          active: formData.active,
          createdAt: new Date(),
        });
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        address: '',
        responsibleName: '',
        responsiblePhone: '',
        instructions: '',
        active: true
      });
      fetchData();
    } catch (error) {
      console.error('Error saving pickup point:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ponto de entrega?')) return;
    
    try {
      await deleteDoc(doc(db, 'pickupPoints', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting pickup point:', error);
    }
  };

  const togglePickupPointActive = async (point: PickupPoint) => {
    try {
      await updateDoc(doc(db, 'pickupPoints', point.id), {
        active: !point.active,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating pickup point:', error);
    }
  };

  const toggleOrderDelivered = async (orderId: string, currentlyDelivered: boolean) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        delivered: !currentlyDelivered,
        deliveredAt: !currentlyDelivered ? new Date() : null,
        deliveryStatus: !currentlyDelivered ? 'delivered' : 'pending',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating order delivery status:', error);
    }
  };

  const getOrdersForPickupPoint = (pickupPointName: string) => {
    return orders.filter(o => 
      o.pickupPoint === pickupPointName && 
      (o.status === 'PAID' || o.status === 'AUTHORIZED')
    );
  };

  const getAllPaidOrders = () => {
    return orders.filter(o => o.status === 'PAID' || o.status === 'AUTHORIZED');
  };

  const toggleAllDelivered = async (pickupPointName: string) => {
    const pointOrders = getOrdersForPickupPoint(pickupPointName);
    const pendingOrders = pointOrders.filter(o => !o.delivered);
    
    if (pendingOrders.length === 0) {
      if (!confirm('Marcar todos como pendentes?')) return;
      
      try {
        for (const order of pointOrders) {
          await updateDoc(doc(db, 'orders', order.id), {
            delivered: false,
            deliveredAt: null,
            deliveryStatus: 'pending',
          });
        }
        fetchData();
      } catch (error) {
        console.error('Error updating orders:', error);
      }
      return;
    }
    
    if (!confirm(`Marcar todos os ${pendingOrders.length} pedidos como entregues?`)) return;
    
    try {
      for (const order of pendingOrders) {
        await updateDoc(doc(db, 'orders', order.id), {
          delivered: true,
          deliveredAt: new Date(),
          deliveryStatus: 'delivered',
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error updating orders:', error);
    }
  };

  const generatePDF = (pickupPoint: PickupPoint) => {
    const pickupOrders = getOrdersForPickupPoint(pickupPoint.name);
    const deliveredOrders = pickupOrders.filter(o => o.delivered);
    const pendingOrders = pickupOrders.filter(o => !o.delivered);

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Entrega - MayNutri', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Ponto de Entrega: ${pickupPoint.name}`, 14, 30);
    doc.text(`Endereço: ${pickupPoint.address || 'Não informado'}`, 14, 36);
    doc.text(`Responsável: ${pickupPoint.responsibleName || 'Não informado'}`, 14, 42);
    doc.text(`Telefone: ${pickupPoint.responsiblePhone || 'Não informado'}`, 14, 48);
    doc.text(`Instruções: ${pickupPoint.instructions || 'Nenhuma'}`, 14, 54);
    
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 64);
    doc.text(`Total de Pedidos: ${pickupOrders.length}`, 14, 70);
    doc.text(`Entregues: ${deliveredOrders.length}`, 14, 76);
    doc.text(`Pendentes: ${pendingOrders.length}`, 14, 82);

    const totalValue = pickupOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2).replace('.', ',')}`, 14, 88);

    let currentY = 98;

    if (pendingOrders.length > 0) {
      doc.setFontSize(14);
      doc.text('Pedidos Pendentes', 14, currentY);
      currentY += 8;
      
      const pendingData = pendingOrders.map(order => [
        `#${order.referenceId?.slice(-6) || order.id.slice(-6)}`,
        order.userName || order.userEmail || '-',
        order.userPhone || '-',
        order.pickupPoint || '-',
        `R$ ${order.total?.toFixed(2).replace('.', ',')}`,
        order.items?.length ? order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ') : '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Pedido', 'Cliente', 'Telefone', 'Retirada', 'Valor', 'Itens']],
        body: pendingData,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 'auto' },
        },
      });
      
      currentY = (pendingOrders.length * 8) + 50;
    }

    if (deliveredOrders.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Pedidos Entregues', 14, 20);
      
      const deliveredData = deliveredOrders.map(order => [
        `#${order.referenceId?.slice(-6) || order.id.slice(-6)}`,
        order.userName || order.userEmail || '-',
        order.userPhone || '-',
        order.pickupPoint || '-',
        `R$ ${order.total?.toFixed(2).replace('.', ',')}`,
        order.items?.length ? order.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ') : '-',
        order.deliveredAt?.toDate ? new Date(order.deliveredAt.toDate()).toLocaleDateString('pt-BR') : '-'
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Pedido', 'Cliente', 'Telefone', 'Retirada', 'Valor', 'Itens', 'Data Entrega']],
        body: deliveredData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 22 },
          3: { cellWidth: 25 },
          4: { cellWidth: 18 },
          5: { cellWidth: 'auto' },
          6: { cellWidth: 22 },
        },
      });
    }

    const fileName = `entrega-${pickupPoint.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const openPickupPointDetails = (point: PickupPoint) => {
    setSelectedPickupPoint(point);
    setShowDetailModal(true);
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
            <h1 className="text-2xl font-black tracking-tighter uppercase">Pontos de Entrega</h1>
          </div>
          <button 
            onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', address: '', responsibleName: '', responsiblePhone: '', instructions: '', active: true }); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-xl hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Novo Ponto
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Total de Pontos</p>
            <p className="text-3xl font-black">{pickupPoints.length}</p>
          </div>
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-6">
            <p className="text-[#22C55E] text-xs font-bold uppercase mb-1">Pontos Ativos</p>
            <p className="text-3xl font-black text-[#22C55E]">
              {pickupPoints.filter(p => p.active).length}
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <p className="text-amber-400 text-xs font-bold uppercase mb-1">Pedidos para Entrega</p>
            <p className="text-3xl font-black text-amber-400">
              {orders.filter(o => (o.status === 'PAID' || o.status === 'AUTHORIZED') && !o.delivered).length}
            </p>
          </div>
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-2xl p-6">
            <p className="text-[#22C55E] text-xs font-bold uppercase mb-1">Já Entregues</p>
            <p className="text-3xl font-black text-[#22C55E]">
              {orders.filter(o => o.delivered).length}
            </p>
          </div>
        </div>

        {pickupPoints.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhum ponto de entrega</h2>
            <p className="text-neutral-500 mb-6">Crie pontos de entrega para organizar as entregas.</p>
            <button 
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', address: '', responsibleName: '', responsiblePhone: '', instructions: '', active: true }); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-black font-bold text-sm uppercase rounded-full hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Criar Ponto de Entrega
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {pickupPoints.map((point, index) => {
              const pointOrders = getOrdersForPickupPoint(point.name);
              const deliveredCount = pointOrders.filter(o => o.delivered).length;
              const pendingCount = pointOrders.filter(o => !o.delivered).length;
              const totalValue = pointOrders.reduce((acc, o) => acc + (o.total || 0), 0);
              
              return (
                <motion.div
                  key={point.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white/[0.02] border rounded-3xl p-6 hover:border-white/20 transition-colors ${
                    point.active ? 'border-white/10' : 'border-red-500/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        point.active ? 'bg-[#22C55E]/10' : 'bg-red-500/10'
                      }`}>
                        <MapPin className={`w-6 h-6 ${
                          point.active ? 'text-[#22C55E]' : 'text-red-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{point.name}</p>
                        <div className="flex items-center gap-2 text-neutral-500 text-sm">
                          <span>{point.address}</span>
                        </div>
                        {point.responsibleName && (
                          <div className="flex items-center gap-2 text-neutral-500 text-xs mt-1">
                            <span>Responsável: {point.responsibleName}</span>
                            <span>({point.responsiblePhone})</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs font-bold uppercase">Pedidos</p>
                        <p className="text-white font-black text-xl">{pointOrders.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs font-bold uppercase">Valor</p>
                        <p className="text-white font-black">R$ {totalValue.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div 
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer ${
                          point.active 
                            ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                            : 'bg-red-500/10 text-red-400'
                        }`}
                        onClick={() => togglePickupPointActive(point)}
                      >
                        {point.active ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </div>
                  
                  {pointOrders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <p className="text-neutral-500 text-xs font-bold uppercase">Status:</p>
                          <span className="text-xs text-amber-400 font-bold">
                            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-[#22C55E] font-bold">
                            {deliveredCount} entrega{deliveredCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleAllDelivered(point.name)}
                            className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors text-amber-400"
                            title="Marcar todos como entregues/pendentes"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Todos
                          </button>
                          <button 
                            onClick={() => generatePDF(point)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Gerar PDF
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pointOrders.slice(0, 8).map(order => (
                          <div 
                            key={order.id}
                            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                              order.delivered ? 'bg-[#22C55E]/10 border border-[#22C55E]/20' : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <span className="text-white font-bold">#{order.referenceId?.slice(-6)}</span>
                            <span className="text-neutral-400">{order.userName || order.userEmail?.split('@')[0]}</span>
                            <span className="text-[#22C55E]">R$ {order.total?.toFixed(2)}</span>
                            {order.delivered ? (
                              <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-400" />
                            )}
                          </div>
                        ))}
                        {pointOrders.length > 8 && (
                          <span className="px-3 py-1.5 text-neutral-500 text-xs">
                            +{pointOrders.length - 8} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => openPickupPointDetails(point)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Ver Detalhes</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(point.id);
                        setFormData({ 
                          name: point.name, 
                          address: point.address,
                          responsibleName: point.responsibleName || '',
                          responsiblePhone: point.responsiblePhone || '',
                          instructions: point.instructions || '',
                          active: point.active 
                        });
                        setShowModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Editar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(point.id)}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPickupPoint && (
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
              
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-6 h-6 text-[#22C55E]" />
                <h2 className="text-xl font-black">{selectedPickupPoint.name}</h2>
              </div>
              <p className="text-neutral-500 text-sm mb-2">{selectedPickupPoint.address}</p>
              {selectedPickupPoint.responsibleName && (
                <p className="text-neutral-400 text-sm mb-6">
                  Responsável: {selectedPickupPoint.responsibleName} - {selectedPickupPoint.responsiblePhone}
                </p>
              )}

              <button 
                onClick={() => generatePDF(selectedPickupPoint)}
                className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-black font-bold text-sm rounded-xl mb-6 hover:scale-105 transition-transform"
              >
                <Download className="w-4 h-4" />
                Baixar Relatório PDF
              </button>

              <button 
                onClick={() => toggleAllDelivered(selectedPickupPoint.name)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl mb-4 hover:bg-white/10 transition-colors w-full justify-center"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar Todos como Entregues/Pendentes
              </button>

              <div className="space-y-3">
                {getOrdersForPickupPoint(selectedPickupPoint.name).map(order => (
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
                        <p className="text-neutral-500 text-xs">{order.userPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-white">R$ {order.total?.toFixed(2).replace('.', ',')}</p>
                        <button 
                          onClick={() => toggleOrderDelivered(order.id, !!order.delivered)}
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
                    
                    {order.items && order.items.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Itens:</p>
                        <div className="space-y-1">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-white/70">{item.name} x{item.quantity}</span>
                              <span className="text-white/50">R$ {((item.unitAmount || 0) / 100).toFixed(2).replace('.', ',')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {getOrdersForPickupPoint(selectedPickupPoint.name).length === 0 && (
                <p className="text-neutral-500 text-center py-8">Nenhum pedido neste ponto de entrega.</p>
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
                {editingId ? 'Editar Ponto de Entrega' : 'Novo Ponto de Entrega'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Nome do Ponto</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Academia ABC"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Endereço</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua exemplo, 123"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Responsável</label>
                  <input 
                    type="text"
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                    placeholder="Nome do responsável"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Telefone do Responsável</label>
                  <input 
                    type="text"
                    value={formData.responsiblePhone}
                    onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-500 text-xs font-bold uppercase block mb-2">Instruções</label>
                  <textarea 
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Instruções para retirada..."
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:border-[#22C55E]/30 outline-none resize-none"
                  />
                </div>

                {editingId && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <span className="text-white text-sm">Ponto ativo</span>
                  </label>
                )}
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
                  disabled={!formData.name || !formData.address}
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
