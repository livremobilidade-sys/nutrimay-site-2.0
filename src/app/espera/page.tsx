"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Clock, Gift, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore";

export default function WaitlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "invalid" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.status === "ACTIVE") {
            router.push("/produtos");
          } else {
            setLoading(false);
          }
        } else {
          router.push("/cadastro/completar");
        }
      } catch (err) {
        console.error("Error checking status", err);
        setLoading(false); // allow them to see the page at least
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleApplyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode || !user) return;
    
    setStatus("checking");
    setErrorMsg("");
    const cleanCode = inviteCode.trim().toUpperCase();

    try {
      const q = query(collection(db, "users"), where("myReferralCode", "==", cleanCode));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setStatus("invalid");
        setErrorMsg("Código inválido ou inexistente.");
        return;
      }

      const referrerData = snap.docs[0].data();
      const referrerId = snap.docs[0].id;

      // Update current user to ACTIVE
      await updateDoc(doc(db, "users", user.uid), {
        status: "ACTIVE",
        referredBy: referrerId
      });

      // Increment referrer's count
      await updateDoc(doc(db, "users", referrerId), {
         referralCount: increment(1)
      });

      setStatus("success");
      setTimeout(() => {
        router.push("/produtos");
      }, 2000);

    } catch (err) {
      setStatus("invalid");
      setErrorMsg("Ocorreu um erro. Tente novamente.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Verificando Credenciais...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] relative flex items-center justify-center py-20 px-6">
       <div className="absolute top-0 inset-x-0 h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />
       
       <div className="w-full max-w-2xl relative z-10">
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 text-center overflow-hidden relative"
          >
             <div className="absolute top-0 right-0 p-32 bg-amber-500/10 blur-[100px] pointer-events-none" />

             <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-10 shadow-2xl shadow-amber-500/20">
                <Clock className="w-10 h-10 text-amber-500" />
             </div>

             <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                Sua Conta está na<br/><span className="text-amber-500">Lista de Espera.</span>
             </h1>

             <p className="text-sm md:text-base font-medium text-neutral-400 mb-12 max-w-lg mx-auto leading-relaxed">
                Para garantir a qualidade impecável dos nossos produtos e o atendimento premium aos nossos clientes, a MayNutri trabalha com uma <strong>capacidade limitada</strong>. 
                <br/><br/>
                No momento, o seu cadastro está em análise. Em breve, enviaremos um e-mail avisando que seu acesso foi liberado para você aproveitar nossa loja completa.
             </p>

             {status === "success" ? (
               <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
                  <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Convite Validado!</h3>
                  <p className="text-xs text-white/50 uppercase mt-2">Acesso liberado. Redirecionando...</p>
               </div>
             ) : (
               <div className="bg-black/40 border border-white/5 p-8 md:p-10 rounded-3xl relative text-left group transition-all duration-500 hover:border-amber-500/30">
                  <div className="flex items-center gap-4 text-amber-500 mb-6">
                     <Gift className="w-6 h-6" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Conseguiu um convite?</h3>
                  </div>
                  <p className="text-xs font-medium text-white/40 mb-6 uppercase">
                     Se você possui o código VIP de um membro fundador ou parceiro, insira abaixo para pular a fila de espera imediatamente.
                  </p>

                  <form onSubmit={handleApplyInvite} className="flex flex-col sm:flex-row gap-4">
                     <div className="relative flex-1">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                           type="text" 
                           placeholder="DIGITE SEU CÓDIGO" 
                           value={inviteCode}
                           onChange={(e) => setInviteCode(e.target.value)}
                           className={`w-full bg-white/5 border rounded-2xl py-5 pl-14 pr-6 text-white font-black text-xs uppercase outline-none transition-all ${status === 'invalid' ? 'border-red-500' : 'border-white/10 focus:border-amber-500/50'}`}
                        />
                     </div>
                     <button 
                        type="submit" 
                        disabled={status === "checking" || !inviteCode}
                        className="bg-amber-500 disabled:bg-white/5 disabled:text-white/20 text-black px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center min-w-[140px]"
                     >
                        {status === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar"}
                     </button>
                  </form>
                  {errorMsg && <p className="text-[10px] text-red-500 mt-4 font-bold uppercase pl-2">{errorMsg}</p>}
               </div>
             )}

             <div className="mt-12">
                <button onClick={handleLogout} className="text-[10px] font-bold text-white/20 uppercase hover:text-white transition-colors underline decoration-white/10 underline-offset-4">
                   Sair da Conta
                </button>
             </div>
          </motion.div>
       </div>
    </main>
  );
}
