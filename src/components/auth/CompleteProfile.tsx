"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Smartphone, MapPin, User, ArrowRight, CheckCircle2, 
  CreditCard, Home, Map, Building2, Mail, AlertCircle, Loader2 
} from "lucide-react";
import { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface CompleteProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userData?: {
    full_name?: string;
    email?: string;
    photoURL?: string;
  };
}

export function CompleteProfile({ isOpen, onClose, onSuccess, userData }: CompleteProfileProps) {
  const [formData, setFormData] = useState({
    name: userData?.full_name || "",
    email: userData?.email || "",
    phone: "",
    cpf: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    pickupPoint: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill from userData
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        name: userData.full_name || prev.name,
        email: userData.email || prev.email
      }));
    }
  }, [userData]);

  const pickupPoints = [
    "Smart Fit - Centro",
    "Bluefit - Jardins",
    "WeWork - Av. Paulista",
  ];

  // Validation Logic (Mirroring Checkout)
  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length === 11) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (v.length === 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return v;
  };

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const maskCEP = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{3})/, "$1-$2");

  const handleCEPChange = async (v: string) => {
    const raw = v.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, cep: maskCEP(v) }));
    
    if (raw.length === 8) {
      setIsLoadingCEP(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (data.erro) throw new Error("CEP não encontrado");
        
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
        setErrors(prev => ({ ...prev, cep: "" }));
      } catch (err) {
        setErrors(prev => ({ ...prev, cep: "CEP não encontrado" }));
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  const handleFinalSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nome obrigatório";
    if (!validateEmail(formData.email)) newErrors.email = "E-mail inválido";
    if (!validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido";
    if (formData.phone.replace(/\D/g, "").length < 10) newErrors.phone = "Telefone incompleto";
    if (formData.cep.replace(/\D/g, "").length < 8) newErrors.cep = "CEP incompleto";
    if (!formData.number) newErrors.number = "Número obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado.");

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email || user.email,
        name: formData.name,
        phone: formData.phone,
        cpf: formData.cpf,
        address: {
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
        },
        pickupPoint: formData.pickupPoint,
        status: "PENDING",
        role: "member",
        profileComplete: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.log("✅ [Profile] Dados salvos no Firestore!");
      onSuccess();
    } catch (err) {
      console.error("❌ [Profile] Erro ao salvar:", err);
      setErrors({ submit: "Erro ao salvar. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 hide-scrollbar">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative w-full max-w-[580px] bg-[#0c0c0e] border border-white/5 rounded-[3.5rem] p-8 md:p-14 shadow-[0_60px_150px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] overflow-y-auto hide-scrollbar"
          >
            <div className="absolute top-0 right-0 p-32 bg-[#22C55E]/5 blur-[120px] pointer-events-none" />

            <div className="relative text-center mb-10">
               <div className="inline-flex items-center gap-2 text-[9px] font-medium uppercase px-4 py-1.5 rounded-full mb-6 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]">
                  <CheckCircle2 className="w-3 h-3" />
                  Conta Autenticada
               </div>
               <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase leading-none">
                  Sempre Pronto.
               </h2>
               <p className="text-white/30 text-[10px] font-medium uppercase">
                  Infraestrutura Premium MayNutri
               </p>
            </div>

            <form className="space-y-10 relative">
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2 opacity-30">
                   <div className="h-[1px] flex-1 bg-white" />
                   <span className="text-[9px] font-black uppercase text-white whitespace-nowrap">Identificação</span>
                   <div className="h-[1px] flex-1 bg-white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">Nome</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full bg-white/[0.03] border rounded-2xl py-5 pl-14 pr-6 text-white font-bold text-xs uppercase focus:border-[#22C55E]/30 outline-none transition-all ${errors.name ? 'border-red-500/50' : 'border-white/5'}`} />
                      {errors.name && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">CPF (Verificação)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                      <input type="text" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" className={`w-full bg-white/[0.03] border rounded-2xl py-5 pl-14 pr-6 text-white font-bold text-xs uppercase focus:border-[#22C55E]/30 outline-none transition-all ${errors.cpf ? 'border-red-500/50' : 'border-white/5'}`} />
                      {errors.cpf && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">WhatsApp</label>
                    <div className="relative">
                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" className={`w-full bg-white/[0.03] border rounded-2xl py-5 pl-14 pr-6 text-white font-bold text-xs uppercase focus:border-[#22C55E]/30 outline-none transition-all ${errors.phone ? 'border-red-500/50' : 'border-white/5'}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">E-mail</label>
                    <input type="email" value={formData.email} readOnly={!!userData?.email} className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-5 px-6 text-white/20 font-bold text-xs uppercase outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2 opacity-30">
                   <div className="h-[1px] flex-1 bg-white" />
                   <span className="text-[9px] font-black uppercase text-white whitespace-nowrap">Endereço & Logística</span>
                   <div className="h-[1px] flex-1 bg-white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 col-span-1">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">CEP {isLoadingCEP && "..."}</label>
                    <input type="text" value={formData.cep} onChange={(e) => handleCEPChange(e.target.value)} placeholder="00000-000" className={`w-full bg-white/[0.03] border rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase focus:border-[#22C55E]/30 outline-none transition-all ${errors.cep ? 'border-red-500/50' : 'border-white/5'}`} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">Ponto de Retirada</label>
                    <select className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase appearance-none cursor-pointer outline-none" value={formData.pickupPoint} onChange={(e) => setFormData({...formData, pickupPoint: e.target.value})}>
                      <option value="" disabled className="bg-neutral-900">Selecione...</option>
                      {pickupPoints.map(p => <option key={p} value={p} className="bg-neutral-900">{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-medium text-white/20 uppercase pl-1">Logradouro</label>
                  <input type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="RUA / AVENIDA" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase focus:border-[#22C55E]/30 outline-none" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">Número</label>
                    <input type="text" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase" />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-3">
                    <label className="text-[9px] font-medium text-white/20 uppercase pl-1">Complemento / Bairro</label>
                    <input type="text" value={`${formData.neighborhood}${formData.complement ? ' - ' + formData.complement : ''}`} readOnly className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-5 px-6 text-white/40 font-bold text-xs uppercase" />
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleFinalSubmit}
                disabled={isSaving}
                className="w-full mt-12 py-1.5 rounded-full bg-[#22C55E] text-black font-black text-[11px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#22C55E]/20 flex items-center justify-center gap-6 group disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Ativar Minha Conta VIP
                    <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center group-hover:rotate-[45deg] transition-all duration-500">
                       <ArrowRight className="w-5 h-5 group-hover:rotate-[-45deg] transition-all duration-500" />
                    </div>
                  </>
                )}
              </button>
            </form>

            <p className="mt-14 text-[8px] text-center text-white/10 uppercase font-medium leading-relaxed">MayNutri • Premium Infrastructure • 2024</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
