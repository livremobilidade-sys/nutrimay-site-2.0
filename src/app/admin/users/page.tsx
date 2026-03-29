"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Search, ShieldCheck,
  X, AlertCircle, Loader2, Trash2, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, updateDoc, doc, deleteDoc
} from "firebase/firestore";

export default function UsersAdmin() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PENDING" | "ALL">("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    }, (err) => {
      alert("Erro Firestore: " + err.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pickupPoints"));
    return onSnapshot(q, (snap) => {
      setPickupPoints(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try { await updateDoc(doc(db, "users", id), { status: "ACTIVE" }); }
    catch { alert("Erro ao aprovar"); }
    finally { setProcessing(null); }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    setProcessing(confirmDeleteId);
    try {
      await deleteDoc(doc(db, "users", confirmDeleteId));
      if (selectedUser?.id === confirmDeleteId) setSelectedUser(null);
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert("FALHA AO DELETAR: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (u.status === "BANNED") return false;
    const matchesTab = activeTab === "ALL" || u.status === activeTab;
    const matchesSearch = (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getUserHub = (userId: string) => pickupPoints.find(p => p.responsibleUserId === userId);
  const getUserInvites = (user: any) => users.filter(u =>
    u.referredBy === user.id || (user.myReferralCode && u.referralCode === user.myReferralCode)
  );

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
      <p className="text-white/20 uppercase text-[10px] font-black tracking-widest">Sincronizando Base VIP...</p>
    </div>
  );

  return (
    <div className="space-y-10 min-h-screen pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Clientes.</h2>
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
        {(["ACTIVE", "PENDING", "ALL"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative ${activeTab === tab ? tab === "PENDING" ? "text-amber-500" : "text-[#22C55E]" : "text-white/20"}`}>
            {tab === "ACTIVE" ? "Membros Ativos" : tab === "PENDING" ? "Pendentes" : "Global"}
            {activeTab === tab && <motion.div layoutId="t-u" className={`absolute bottom-0 left-0 right-0 h-1 ${tab === "PENDING" ? "bg-amber-500" : "bg-[#22C55E]"}`} />}
          </button>
        ))}
      </div>

      <div className="bg-[#0c0c0e] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest">Identidade VIP</th>
              <th className="px-8 py-6 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">Controle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 && (
              <tr><td colSpan={2} className="p-8 text-center text-white/20 text-[10px] uppercase font-bold tracking-widest">Nenhum resultado encontrado.</td></tr>
            )}
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.01] transition-all cursor-pointer group" onClick={() => setSelectedUser(user)}>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" /> : <div className="text-xl font-black text-white/10">{user.name?.[0]}</div>}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">{user.name || "Sem Nome"}</p>
                      <p className="text-[9px] text-[#22C55E] tracking-widest font-bold">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-4">
                    {user.status === "PENDING" && (
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(user.id); }} className="p-3 bg-[#22C55E]/10 text-[#22C55E] rounded-full hover:bg-[#22C55E] hover:text-black transition-all">
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={(e) => handleDeleteClick(e, user.id)} disabled={processing === user.id} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all active:scale-90 disabled:opacity-50">
                      {processing === user.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (() => {
          const hub = getUserHub(selectedUser.id);
          const invites = getUserInvites(selectedUser);
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedUser(null)} />
              <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-[#0c0c0e] border border-white/10 rounded-[3rem] p-10 overflow-y-auto max-h-[90vh] shadow-[0_50px_100px_rgba(0,0,0,1)] hide-scrollbar"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                      {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-8 h-8 text-white/20 m-4" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">{selectedUser.name || "Sem Nome"}</h3>
                      <p className="text-[10px] text-[#22C55E] uppercase tracking-widest font-bold">{selectedUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${selectedUser.status === "ACTIVE" ? "text-[#22C55E] border-[#22C55E]/20 bg-[#22C55E]/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"}`}>
                          {selectedUser.status}
                        </span>
                        {hub && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border text-purple-400 border-purple-400/20 bg-purple-400/5">
                            Resp. Hub: {hub.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-3 text-white/20 hover:text-white bg-white/5 rounded-full transition-all"><X className="w-4 h-4" /></button>
                </div>

                {/* Personal Data */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">CPF</p>
                    <p className="text-xs font-black text-white uppercase">{selectedUser.cpf || "Não Informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Telefone / WhatsApp</p>
                    <p className="text-xs font-black text-white uppercase">{selectedUser.phone || "Não Informado"}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Endereço Completo</p>
                    {selectedUser.address?.street ? (
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">
                          {selectedUser.address.street}, {selectedUser.address.number}
                          {selectedUser.address.complement ? ` - ${selectedUser.address.complement}` : ""}
                        </p>
                        <p className="text-[9px] text-white/50 uppercase mt-0.5">
                          {selectedUser.address.neighborhood} • {selectedUser.address.city}/{selectedUser.address.state}
                        </p>
                        <p className="text-[9px] text-[#22C55E] font-bold uppercase mt-0.5">CEP: {selectedUser.address.cep || "Não Informado"}</p>
                      </div>
                    ) : <p className="text-[10px] font-black text-white/30 uppercase">Não Informado</p>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Ponto de Retirada</p>
                    <p className="text-[10px] font-black text-[#22C55E] uppercase">{selectedUser.pickupPoint || "Não Informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Códigos VIP</p>
                    <p className="text-[10px] font-black text-amber-400 uppercase">Seu: {selectedUser.myReferralCode || "Nenhum"}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase">Usou: {selectedUser.referralCode || "Nenhum"}</p>
                  </div>
                </div>

                {/* Invites Section */}
                <div className="border-t border-white/5 pt-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Convidados por este Membro</p>
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full ${invites.length > 0 ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-white/5 text-white/20"}`}>
                      {invites.length} AMIGOS
                    </span>
                  </div>
                  {invites.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar">
                      {invites.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <div>
                            <p className="text-[10px] font-black text-white uppercase">{friend.name || "Pendente"}</p>
                            <p className="text-[8px] text-white/30 uppercase tracking-widest">{friend.email}</p>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${friend.status === "ACTIVE" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-amber-500/10 text-amber-500"}`}>
                            {friend.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[10px] text-white/10 font-black uppercase tracking-widest py-4">Nenhum convidado ainda.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 border-t border-white/5 pt-6">
                  {selectedUser.status === "PENDING" && (
                    <button onClick={() => { handleApprove(selectedUser.id); setSelectedUser(null); }} className="flex-1 py-4 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#22C55E] hover:text-black transition-all">
                      <CheckCircle2 className="w-4 h-4 inline mr-2" /> Aprovar VIP
                    </button>
                  )}
                  <button onClick={(e) => handleDeleteClick(e, selectedUser.id)} className="flex-1 py-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    Remover da Base
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setConfirmDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-[#0c0c0e] border border-red-500/20 rounded-3xl p-8 text-center shadow-[0_0_100px_rgba(239,68,68,0.2)]"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Excluir Membro?</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8">Esta ação é permanente e removerá todos os dados do sistema.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/50 bg-white/5 rounded-xl hover:bg-white/10 hover:text-white transition-all">Cancelar</button>
                <button onClick={executeDelete} disabled={processing === confirmDeleteId} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all shadow-xl disabled:opacity-50">
                  {processing === confirmDeleteId ? "Deletando..." : "Sim, Excluir"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
