"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, PlusCircle, Search, Trash2, Edit, X, Loader2, Save, Users, Building, Activity, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, getDocs, serverTimestamp 
} from "firebase/firestore";

interface PickupPoint {
  id?: string;
  name: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  responsibleUserId: string;
  responsibleName: string;
  active: boolean;
  createdAt?: any;
}

export default function PickupPointsAdmin() {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState<PickupPoint>({
    name: "",
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    responsibleUserId: "",
    responsibleName: "",
    active: true,
  });

  useEffect(() => {
    // Escutar Pontos de Retirada
    const qPoints = query(collection(db, "pickupPoints"));
    const unsubPoints = onSnapshot(qPoints, (snapshot) => {
      setPoints(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PickupPoint)));
      setLoading(false);
    });

    // Buscar Usuários para o select (uma vez, pois é admin)
    const fetchUsers = async () => {
      const uSnap = await getDocs(collection(db, "users"));
      setUsers(uSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    };
    fetchUsers();

    return () => unsubPoints();
  }, []);

  const openModal = (point?: PickupPoint) => {
    if (point) {
      setFormData(point);
      setEditingId(point.id || null);
    } else {
      setFormData({
        name: "", zipCode: "", street: "", number: "", neighborhood: "", city: "", state: "", responsibleUserId: "", responsibleName: "", active: true
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleUserSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const user = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      responsibleUserId: userId,
      responsibleName: user ? user.name : ""
    }));
  };

  const handleCepSearch = async () => {
    const cepStr = formData.zipCode.replace(/\D/g, "");
    if (cepStr.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepStr}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch(e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "pickupPoints", editingId), {
           ...formData,
           updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "pickupPoints"), {
           ...formData,
           createdAt: serverTimestamp(),
           updatedAt: serverTimestamp()
        });
      }
      closeModal();
    } catch (err) {
      alert("Erro ao salvar Ponto de Retirada.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Deseja EXCLUIR PERMANENTEMENTE este Ponto de Retirada?")) {
       try {
          await deleteDoc(doc(db, "pickupPoints", id));
       } catch (err) {
          alert("Erro ao tentar deletar.");
       }
    }
  };

  const filteredPoints = points.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.responsibleName && p.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
     <div className="h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
        <p className="text-white/20 uppercase text-[10px] font-black tracking-widest">Sincronizando Malha Logística...</p>
     </div>
  );

  return (
    <div className="space-y-10 min-h-screen pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Logística Hub.</h2>
            <p className="text-[#22C55E] text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
               <ShieldCheck className="w-4 h-4" /> Gestão de Pontos de Retirada VIP
            </p>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
               <input 
                  type="text" placeholder="BUSCAR PONTO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-[10px] font-black uppercase text-white outline-none w-[240px] focus:border-[#22C55E]/40 transition-all"
               />
            </div>
            <button onClick={() => openModal()} className="px-6 py-3 bg-[#22C55E] text-black rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-[#22C55E]/20">
               <PlusCircle className="w-4 h-4" /> Novo Hub
            </button>
         </div>
      </div>

      <div className="bg-[#0c0c0e] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest">Localização</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest">Responsável</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">Ação</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {filteredPoints.length === 0 && (
                 <tr><td colSpan={4} className="p-8 text-center text-white/20 text-[10px] uppercase font-bold tracking-widest">Nenhum ponto registrado.</td></tr>
               )}
               {filteredPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-white/[0.01] transition-all cursor-pointer group" onClick={() => openModal(point)}>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#22C55E]">
                              <MapPin className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-white uppercase">{point.name}</p>
                              <p className="text-[9px] text-white/40 tracking-widest font-bold uppercase">{point.city} - {point.state}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <Users className="w-3 h-3 text-amber-500" />
                           <span className="text-[10px] font-bold text-white uppercase tracking-widest">{point.responsibleName || "Não Vinculado"}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${point.active ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                           <Activity className="w-3 h-3" /> {point.active ? "Operando" : "Inativo"}
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                           <button onClick={(e) => handleDelete(e, point.id!)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all active:scale-90">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <AnimatePresence>
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={closeModal} />
               <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} 
                 className="relative w-full max-w-3xl bg-[#0c0c0e] border border-white/10 rounded-[3rem] p-10 overflow-y-auto max-h-[90vh] shadow-[0_50px_100px_rgba(0,0,0,1)] hide-scrollbar"
               >
                  <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
                           <Building className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tighter">{editingId ? "Editar Hub" : "Registrar Novo Hub"}</h3>
                           <p className="text-[9px] text-white/30 uppercase tracking-widest">Painel de Configuração de Malha da NutriMay</p>
                        </div>
                     </div>
                     <button onClick={closeModal} className="p-3 text-white/20 hover:text-white bg-white/5 rounded-full transition-all"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-1 md:col-span-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Nome de Exibição do Ponto</label>
                           <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Academia Fit Premium" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Membro Responsável Pela Operação</label>
                           <select required value={formData.responsibleUserId} onChange={handleUserSelectChange} className="w-full bg-[#0c0c0e] border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all">
                              <option value="">-- SELECIONE O CLIENTE RESPONSÁVEL --</option>
                              {users.map(u => (
                                 <option key={u.id} value={u.id}>{u.name || "Sem Nome"} ({u.email})</option>
                              ))}
                           </select>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">CEP</label>
                           <input required type="text" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} onBlur={handleCepSearch} placeholder="00000-000" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Endereço (Rua/Av)</label>
                           <input required type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>
                        
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Número</label>
                           <input required type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Bairro</label>
                           <input required type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Cidade</label>
                           <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">UF (Estado)</label>
                           <input required type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-[#22C55E]/40 transition-all" />
                        </div>
                     </div>

                     <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer group">
                           <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${formData.active ? 'bg-[#22C55E]' : 'bg-white/10'}`}>
                              <div className={`w-4 h-4 bg-black rounded-full absolute transition-all ${formData.active ? 'left-[26px]' : 'left-1'}`} />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Hub Ativo e Operante</span>
                        </label>

                        <button type="submit" disabled={processing} className="px-10 py-4 bg-[#22C55E] text-black rounded-full font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#22C55E]/20 disabled:opacity-50">
                           {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Finalizar</>}
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
