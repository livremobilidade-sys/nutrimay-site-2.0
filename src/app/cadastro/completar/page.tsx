"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Smartphone, MapPin, User, ArrowRight, CheckCircle2, 
  CreditCard, Home, Map, Building2, Mail, AlertCircle, Loader2,
  Navigation, Globe, Zap, Users, Gift, ShieldCheck, Heart, Share2, Copy
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  doc, setDoc, getDoc, serverTimestamp, 
  collection, query, where, getDocs, updateDoc, increment 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function CompleteProfilePage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const [referralStatus, setReferralStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [referrerData, setReferrerData] = useState<any>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeTypeStatus, setCodeTypeStatus] = useState<"idle" | "available" | "taken">("idle");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    gender: "male",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    pickupPoint: "",
    photoURL: "",
    referralCode: "", // Input code from who invited them
    myReferralCode: "", // Their own code to SHARE
    status: "PENDING" // Current user status
  });

  const pickupPoints = ["Smart Fit - Centro", "Bluefit - Jardins", "WeWork - Av. Paulista", "Condomínio Horizonte", "Academia BodyTech"];

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };
  const validatePhone = (phone: string) => phone.replace(/\D/g, "").length >= 10;

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (touched.phone && !validatePhone(formData.phone)) newErrors.phone = "WhatsApp inválido";
    if (touched.cpf && !validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido";
    if (touched.number && !formData.number) newErrors.number = "Nº obrigatório";
    setErrors(newErrors);
  }, [formData, touched]);

  // --- REFERRAL LOGIC ---
  const checkReferralCode = async (code: string) => {
    if (!code) { setReferralStatus("idle"); setReferrerData(null); return; }
    const clean = code.trim().toUpperCase();
    try {
      const q = query(collection(db, "users"), where("myReferralCode", "==", clean));
      const snap = await getDocs(q);
      if (!snap.empty) { setReferralStatus("valid"); setReferrerData(snap.docs[0].data()); }
      else { setReferralStatus("invalid"); setReferrerData(null); }
    } catch (e) { setReferralStatus("invalid"); }
  };

  const checkMyCodeUniqueness = async (newCode: string) => {
    const clean = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    setFormData(prev => ({ ...prev, myReferralCode: clean }));
    if (clean.length < 3) { setCodeTypeStatus("idle"); return; }
    
    setIsCheckingCode(true);
    try {
      const q = query(collection(db, "users"), where("myReferralCode", "==", clean));
      const snap = await getDocs(q);
      if (snap.empty) setCodeTypeStatus("available");
      else setCodeTypeStatus(snap.docs[0].id === user?.uid ? "available" : "taken");
    } catch (e) { setCodeTypeStatus("idle"); }
    finally { setIsCheckingCode(false); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/"); return; }
      setUser(currentUser);
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData(prev => ({
          ...prev,
          name: data.name || currentUser.displayName || "",
          email: data.email || currentUser.email || "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          gender: data.gender || "male",
          photoURL: data.photoURL || currentUser.photoURL || "",
          referralCode: data.referredBy ? "LOCKED" : "",
          myReferralCode: data.myReferralCode || "",
          status: data.status || "PENDING",
          ...data.address
        }));
        if (data.referredBy) {
          const refSnap = await getDoc(doc(db, "users", data.referredBy));
          if (refSnap.exists()) { setReferralStatus("valid"); setReferrerData(refSnap.data()); }
        }
      } else {
        setFormData(prev => ({ 
          ...prev, name: currentUser.displayName || "", 
          email: currentUser.email || "", 
          photoURL: currentUser.photoURL || "",
          myReferralCode: (currentUser.displayName?.split(" ")[0].toUpperCase() || "VIP") + "-" + Math.floor(1000 + Math.random() * 9000)
        }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleCEPChange = async (v: string) => {
    const raw = v.replace(/\D/g, "").slice(0, 8);
    setFormData(prev => ({ ...prev, cep: raw.replace(/(\d{5})(\d{3})/, "$1-$2") }));
    if (raw.length === 8) {
      setIsLoadingCEP(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (data.erro) throw new Error();
        setFormData(prev => ({ ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
      } catch (err) { setErrors(prev => ({ ...prev, cep: "CEP Inválido" })); } 
      finally { setIsLoadingCEP(false); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0 || !user || codeTypeStatus === "taken") return;
    setSaving(true);

    try {
      const finalStatus = referralStatus === "valid" ? "ACTIVE" : formData.status;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        gender: formData.gender,
        photoURL: formData.photoURL,
        myReferralCode: formData.myReferralCode,
        referredBy: referrerData ? (referrerData.uid || referrerData.id) : (formData.referralCode === "LOCKED" ? null : null), // Keep previous if locked
        address: {
          cep: formData.cep, street: formData.street, number: formData.number,
          complement: formData.complement, neighborhood: formData.neighborhood,
          city: formData.city, state: formData.state,
        },
        pickupPoint: formData.pickupPoint,
        status: finalStatus,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      if (referrerData && formData.referralCode !== "LOCKED") {
        await updateDoc(doc(db, "users", referrerData.uid || referrerData.id), { referralCount: increment(1) });
      }
      
      setShowSuccessPopup(true);
      setTimeout(() => {
        if (finalStatus === "ACTIVE") {
          router.push("/produtos");
        } else {
          router.push("/espera");
        }
      }, 2000);
      
    } catch (err) { setErrors({ submit: "Erro ao salvar cadastro." });
    } finally { setSaving(false); }
  };

  const shareViaWhatsApp = () => {
    const msg = `Olá! Acabei de me tornar Membro VIP na MayNutri. Use meu código ${formData.myReferralCode} para acesso instantâneo e benefícios! Acesse: https://nutrimay.com.br`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return (
     <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mb-4" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sincronizando Base VIP...</p>
     </div>
  );

  return (
    <main className="min-h-screen bg-[#09090b] relative">
      <div className="container mx-auto px-6 py-12 md:py-24 max-w-4xl relative z-10">
        
        <div className="text-center mb-16">
          <div className="flex flex-col items-center gap-8 mb-8">
            <div className={`w-32 h-32 rounded-[2.5rem] border-2 flex items-center justify-center text-3xl font-black shadow-2xl overflow-hidden transition-all duration-700 ${formData.gender === 'female' ? 'border-rose-400/30 shadow-rose-500/10' : 'border-[#22C55E]/30 shadow-[#22C55E]/10'}`}>
               {formData.photoURL ? <img src={formData.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20 uppercase">{formData.name?.[0]}</div>}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Gestão <span className={formData.gender === 'female' ? 'text-rose-400' : 'text-[#22C55E]'}>VIP Account.</span></h1>
            {formData.status === 'ACTIVE' && (
               <div className="px-6 py-2 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full text-[#22C55E] text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" /> Acesso VIP Ativado
               </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Main Profile Info */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-16 space-y-10 shadow-2xl backdrop-blur-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Nome Completo</label>
                       <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Sexo Visual</label>
                       <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                          <button type="button" onClick={() => setFormData({...formData, gender: 'male'})} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${formData.gender === 'male' ? 'bg-[#22C55E] text-black' : 'text-white/20'}`}>Masculino</button>
                          <button type="button" onClick={() => setFormData({...formData, gender: 'female'})} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${formData.gender === 'female' ? 'bg-rose-400 text-black' : 'text-white/20'}`}>Feminino</button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">WhatsApp de Contato</label>
                       <input type="text" value={formData.phone} onBlur={() => setTouched(p => ({...p, phone:true}))} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")})} className={`w-full bg-white/5 border rounded-2xl py-5 px-6 text-white font-bold text-xs outline-none ${errors.phone ? 'border-red-500/50' : 'border-white/5'}`} />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">CEP de Entrega</label>
                       <input type="text" value={formData.cep} onChange={(e) => handleCEPChange(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs outline-none" placeholder="00000-000" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-white/20 uppercase tracking-widest pl-1">Ponto de Retirada</label>
                       <select value={formData.pickupPoint} onChange={(e) => setFormData({...formData, pickupPoint: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs outline-none">
                          <option value="">Selecione...</option>
                          {pickupPoints.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                       <div className="col-span-3 space-y-2"><label className="text-[9px] font-black text-white/20 uppercase pl-1 text-white/20">Rua</label><input value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase outline-none" /></div>
                       <div className="col-span-1 space-y-2"><label className="text-[9px] font-black text-white/20 uppercase pl-1 text-white/20">Nº</label><input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white font-bold text-xs uppercase outline-none" /></div>
                    </div>
                 </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* 1. INPUT REFEREE (Only show if NOT active yet AND no referrer set) */}
             {formData.status !== 'ACTIVE' && formData.referralCode !== "LOCKED" ? (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-10 rounded-[3rem] border border-[#22C55E]/30 bg-[#22C55E]/[0.02] space-y-6">
                   <div className="flex items-center gap-4 text-[#22C55E] mb-2">
                      <Zap className="w-5 h-5 fill-[#22C55E]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#22C55E]">Ativação Expressa</span>
                   </div>
                   <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">Quem te convidou?</h4>
                   <p className="text-[10px] font-medium text-white/30 uppercase leading-relaxed">Membros com convite entram no site na hora. Sem convite, o acesso depende de aprovação manual.</p>
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="CÓDIGO DE CONVITE"
                        value={formData.referralCode}
                        onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                        onBlur={(e) => checkReferralCode(e.target.value)}
                        className={`w-full bg-white/5 border rounded-2xl py-6 px-7 text-white font-black text-xs uppercase outline-none transition-all ${referralStatus === 'valid' ? 'border-[#22C55E] ring-4 ring-[#22C55E]/10' : 'border-white/10'}`}
                      />
                      {referralStatus === 'valid' && <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#22C55E]" />}
                   </div>
                </motion.div>
             ) : (
                <div className="p-10 rounded-[3rem] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-relaxed">Sua conta já possui um status ativo ou foi validada por convite.</p>
                </div>
             )}

             {/* 2. CUSTOMIZE OWN CODE (Only available to ACTIVE users) */}
             {formData.status === 'ACTIVE' && (
                <div id="convite" className="p-10 rounded-[3rem] border border-amber-500/20 bg-amber-500/[0.02] space-y-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-20 bg-amber-500/5 blur-[100px] pointer-events-none" />
                   <div className="flex items-center gap-4 text-amber-500 mb-2">
                      <Gift className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Viral Marketing VIP</span>
                   </div>
                   <h4 className="text-xl font-black text-white uppercase tracking-tighter">Seu Código de Convite</h4>
                   <p className="text-[10px] font-medium text-white/30 uppercase leading-relaxed">Membros que usarem seu código somam pontos no seu perfil de Membro Fundador.</p>
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="PERSONALIZE SEU CÓDIGO"
                        value={formData.myReferralCode}
                        onChange={(e) => checkMyCodeUniqueness(e.target.value)}
                        className={`w-full bg-white/5 border rounded-2xl py-6 px-7 text-white font-black text-xs uppercase outline-none transition-all ${codeTypeStatus === 'available' ? 'border-[#22C55E]' : codeTypeStatus === 'taken' ? 'border-red-500' : 'border-white/10 focus:border-amber-500/30'}`}
                      />
                      {isCheckingCode && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />}
                      {codeTypeStatus === 'available' && (
                        <button type="button" onClick={shareViaWhatsApp} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#22C55E] text-black rounded-xl hover:scale-105 transition-all shadow-xl shadow-[#22C55E]/20">
                           <Share2 className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                   {codeTypeStatus === 'taken' && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">⚠️ Código em uso. Seja mais criativo!</p>}
                </div>
             )}

          </div>

          <div className="text-center pt-10">
             <button 
                type="submit" 
                disabled={saving || codeTypeStatus === "taken"} 
                className={`group relative px-20 py-5 font-black text-[13px] uppercase rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 ${formData.gender === 'female' ? 'bg-rose-400 text-black shadow-rose-500/30' : 'bg-[#22C55E] text-black shadow-[#22C55E]/30'}`}
             >
                {saving ? "Salvando Base Cloud..." : "Atualizar Perfil & Iniciar Saúde"}
             </button>
          </div>
        </form>

      </div>
      
      {showSuccessPopup && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#09090b] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
               <div className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Base Sincronizada!</h3>
               <p className="text-xs text-neutral-400 uppercase font-medium">Seu perfil foi atualizado com sucesso na nossa nuvem VIP.</p>
            </motion.div>
         </div>
      )}
    </main>
  );
}
