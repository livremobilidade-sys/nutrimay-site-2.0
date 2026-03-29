"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, CheckCircle2, XCircle, Search, 
  Filter, MoreHorizontal, ArrowUpRight, ShieldCheck,
  X, Mail, Smartphone, CreditCard, MapPin, Navigation,
  Clock, Calendar, Zap, AlertCircle, RefreshCcw, Eye, ArrowRight,
  Loader2, UserSearch, Trash2, Ban, Crown, Briefcase, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase Imports
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, 
  updateDoc, doc, where, orderBy, deleteDoc 
} from "firebase/firestore";

export default function UsersAdmin() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PENDING" | "ALL">("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Use a query without strict ordering to ensure all users show up
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ 
        ...d.data(), 
        id: d.id,
      }));
      setUsers(data);
      setLoading(false);
    }, (error) => {
      console.error("❌ Erro CloudSync:", error);
      alert("Erro ao conectar ao banco de dados: " + error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
     setProcessing(id);
     try {
        await updateDoc(doc(db, "users", id), { status: "ACTIVE" });
     } catch (e) { alert("Erro ao aprovar"); }
     finally { setProcessing(null); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
     // 1. Force stop bubbling
     e.stopPropagation();
     e.preventDefault();

     // 2. Initial alert to confirm the click was registered
     console.log("🔥 [ADMIN] Tentativa de deleção iniciada para ID:", id);
     
     const confirmMsg = `⚠️ EXCLUIR PERMANENTEMENTE?\n\nMembro: ${name || 'N/A'}\nUID: ${id}\n\nDeseja continuar?`;
     
     if (window.confirm(confirmMsg)) {
        setProcessing(id);
        try {
           console.log("🛠️ Excluindo acesso (BANNED)...");
           const userDocRef = doc(db, "users", id);
           
           await updateDoc(userDocRef, { status: "BANNED" });
           
           console.log("✅ Usuário banido.");
           alert("MEMBRO REMOVIDO COM SUCESSO! ✅");
           
           if (selectedUser?.id === id) setSelectedUser(null);
        } catch (error) {
           console.error("❌ ERRO CRÍTICO AO DELETAR:", error);
           alert("FALHA NA EXCLUSÃO: " + (error as any).message);
        } finally {
           setProcessing(null);
        }
     }
  };

  const filteredUsers = users.filter(u => {
    if (u.status === "BANNED") return false;
    const matchesTab = (activeTab === "ALL" && u.status !== "BANNED") || u.status === activeTab;
    const matchesSearch = (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return (
     <div className="h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
        <p className="text-white/20 uppercase text-[10px] font-black tracking-widest">Sincronizando Banco VIP...</p>
     </div>
  );

  return (
    <div className="space-y-10 min-h-screen pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">VIP CRM.</h2>
            <p className="text-[#22C55E] text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
               <ShieldCheck className="w-4 h-4" /> Gestão de Acesso Total
            </p>
         </div>
         <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
               type="text" placeholder="BUSCAR MEMBRO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-[10px] font-black uppercase text-white outline-none w-[300px] focus:border-[#22C55E]/40 transition-all"
            />
         </div>
      </div>

      <div className="flex gap-8 border-b border-white/5">
         <button onClick={() => setActiveTab("ACTIVE")} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'ACTIVE' ? 'text-[#22C55E]' : 'text-white/20'}`}>
            Membros Ativos
            {activeTab === 'ACTIVE' && <motion.div layoutId="t-u" className="absolute bottom-0 left-0 right-0 h-1 bg-[#22C55E]" />}
         </button>
         <button onClick={() => setActiveTab("PENDING")} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'PENDING' ? 'text-amber-500' : 'text-white/20'}`}>
            Pendentes
            {activeTab === 'PENDING' && <motion.div layoutId="t-u" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
         </button>
         <button onClick={() => setActiveTab("ALL")} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'ALL' ? 'text-white' : 'text-white/20'}`}>Global</button>
      </div>

      {/* Simplified Table for Maximum Stability */}
      <div className="bg-[#0c0c0e] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest">Identidade VIP</th>
                  <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">Controle</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01] transition-all cursor-pointer group" onClick={() => setSelectedUser(user)}>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                              {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="text-xl font-black text-white/10">{user.name?.[0]}</div>}
                           </div>
                           <div>
                              <p className="text-xs font-black text-white uppercase">{user.name || "Sem Nome"}</p>
                              <p className="text-[9px] text-[#22C55E] tracking-widest font-bold">{user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                           {user.status === 'PENDING' && (
                              <button onClick={(e) => { e.stopPropagation(); handleApprove(user.id); }} className="p-3 bg-[#22C55E]/10 text-[#22C55E] rounded-full hover:bg-[#22C55E] hover:text-black transition-all">
                                 <CheckCircle2 className="w-5 h-5" />
                              </button>
                           )}
                           <button 
                             onClick={(e) => handleDelete(e, user.id, user.name)}
                             disabled={processing === user.id}
                             className="z-50 p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-90"
                           >
                              {processing === user.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <AnimatePresence>
         {selectedUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedUser(null)} />
               <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} 
                 className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-[3.5rem] p-12 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)]"
               >
                  <div className="flex justify-between items-start mb-10">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                           {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-white/20 m-5" />}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedUser.name || "Sem Nome"}</h3>
                           <p className="text-[10px] text-[#22C55E] uppercase tracking-widest font-bold">{selectedUser.email}</p>
                           <div className="mt-2 text-[9px] font-black uppercase text-white/30 tracking-widest px-2 py-0.5 border border-white/10 rounded-full inline-block">
                             Status: {selectedUser.status}
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedUser(null)} className="p-4 text-white/20 hover:text-white"><X /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5 mb-8">
                     <div className="space-y-1">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">CPF</p>
                        <p className="text-xs font-black text-white uppercase">{selectedUser.cpf || "Não Informado"}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Telefone</p>
                        <p className="text-xs font-black text-white uppercase">{selectedUser.phone || "Não Informado"}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Endereço</p>
                        <p className="text-[10px] font-black text-white uppercase">
                          {selectedUser.address?.street ? `${selectedUser.address.street}, ${selectedUser.address.number}` : "Não Informado"}
                          {selectedUser.address?.complement ? ` - ${selectedUser.address.complement}` : ""}
                        </p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Bairro / Cidade</p>
                        <p className="text-[10px] font-black text-white uppercase">{selectedUser.address?.neighborhood || "Não Informado"} • {selectedUser.address?.city || ""}/{selectedUser.address?.state || ""}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Ponto de Retirada</p>
                        <p className="text-[10px] font-black text-[#22C55E] uppercase">{selectedUser.pickupPoint || "Não Informado"}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Códigos VIP</p>
                        <p className="text-[10px] font-black text-amber-500 uppercase">Seu: {selectedUser.myReferralCode || "Nenhum"}</p>
                        <p className="text-[10px] font-black text-white/50 uppercase">Usou: {selectedUser.referralCode || "Nenhum"}</p>
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-white/5">
                     {selectedUser.status === 'PENDING' && (
                        <button 
                          onClick={(e) => { setSelectedUser(null); handleApprove(selectedUser.id); }}
                          className="flex-1 py-4 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#22C55E] hover:text-black transition-all shadow-xl"
                        >
                           <CheckCircle2 className="w-4 h-4 inline mr-2" /> Aprovar VIP
                        </button>
                     )}
                     <button 
                       onClick={(e) => handleDelete(e, selectedUser.id, selectedUser.name)}
                       className="flex-1 py-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl"
                     >
                        Remover da Base
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
