"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setName("");
  }, [authMode, isOpen]);

  const saveUserToFirestore = async (user: any, extraData: any = {}) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || extraData.name || "Membro VIP",
          photoURL: user.photoURL || "",
          status: "PENDING",
          role: "member",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) { console.error("Erro Firestore:", e); }
  };

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      "auth/email-already-in-use": "Este e-mail já está cadastrado.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/user-not-found": "E-mail não encontrado.",
      "auth/invalid-email": "E-mail inválido.",
      "auth/weak-password": "Senha muito fraca.",
      "auth/popup-closed-by-user": "Login cancelado.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/operation-not-allowed": "Vá no Firebase Console e habilite o login do Google/Apple em 'Authentication > Sign-in method'.",
      "auth/unauthorized-domain": "Domínio Localhost não autorizado no Firebase Console. Adicione 'localhost' em 'Authentication > Settings > Authorized domains'.",
    };
    return messages[code] || `Erro: ${code}. Tente novamente.`;
  };

  const checkProfileAndRedirect = async (user: any) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().profileComplete) {
        onSuccess?.();
        onClose();
        // Stay on page or go to products
      } else {
        router.push("/cadastro/completar");
        onClose();
      }
    } catch (e) {
      console.error("Erro redirect:", e);
      onSuccess?.();
      onClose();
    }
  };

  const handleSocialLogin = async (provider: any) => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔥 [Auth] Tentando login social...");
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);
      await checkProfileAndRedirect(result.user);
    } catch (err: any) {
      console.error("❌ [Auth] Erro Real:", err.code, err.message);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let userCredential;
      if (authMode === "signup") {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user, { name });
        router.push("/cadastro/completar");
        onClose();
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        await checkProfileAndRedirect(userCredential.user);
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const socialButtons = [
    { name: "Apple", icon: <path d="M12.152 6.896c-.548 0-1.711-.516-2.861-.516-1.514 0-2.893.872-3.666 2.223-1.571 2.723-.4 6.746 1.127 8.941.742 1.074 1.63 2.274 2.783 2.274 1.109 0 1.528-.68 2.87-.68s1.722.68 2.89.68c1.201 0 1.956-1.073 2.697-2.15.86-1.242 1.211-2.438 1.233-2.502-.022-.01-.24-.093-1.066-.411-1.033-.422-1.89-1.258-2.34-2.28-.482-1.096-.445-2.274.1-3.238.337-.597.839-1.067 1.439-1.353-.59-.876-1.525-1.423-2.6.49-.607-.383-1.38-.607-2.2-.607zM11.51 3c-.01 0 0 .01 0 0 .01-.01.02-.01.04-.01.67-.04 1.34.19 1.88.62.61.48 1.01 1.21 1.05 1.98.01.07.01.14.01.21-.69.05-1.34-.18-1.87-.62-.64-.52-1.02-1.28-1.01-2.08l-.1-.1z" />, color: "bg-white text-black", provider: appleProvider, label: "Continuar com Apple" },
    { name: "Google", icon: <><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></>, color: "bg-white/5 border border-white/10 text-white", provider: googleProvider, label: "Continuar com Google" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 hide-scrollbar">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
          <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} onClick={onClose} className="fixed top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white transition-all z-[210] shadow-2xl"><X className="w-6 h-6" /></motion.button>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative w-full max-w-[440px] bg-[#0c0c0e] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh] hide-scrollbar">
            <div className="absolute top-0 right-0 p-32 bg-[#22C55E]/5 blur-[100px] pointer-events-none" />
            <div className="relative text-center mb-10">
               <div className="inline-flex text-[9px] font-medium uppercase px-4 py-1.5 rounded-full mb-6 bg-white/5 border border-white/10 text-white/40">Acesso Exclusivo</div>
               <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">{authMode === 'login' ? 'Entrar.' : authMode === 'signup' ? 'Criar Conta.' : 'Recuperar.'}</h2>
               <p className="text-white/30 text-xs font-medium uppercase">MayNutri • Premium Experience</p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
               {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
                     <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                     <p className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">{error}</p>
                  </motion.div>
               )}
            </AnimatePresence>

            {authMode !== 'forgot' && (
              <div className="space-y-3 mb-8">
                {socialButtons.map((btn) => (
                  <button key={btn.name} onClick={() => handleSocialLogin(btn.provider)} disabled={loading} className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${btn.color}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={btn.name === 'Apple' ? 'currentColor' : 'none'}>{btn.icon}</svg>
                    <span className="text-[11px] font-black uppercase">{btn.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1 bg-white/5" /><span className="text-[10px] font-medium text-white/20 uppercase">ou</span><div className="h-[1px] flex-1 bg-white/5" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
               {authMode === 'signup' && (
                  <input type="text" placeholder="SEU NOME" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white placeholder:text-white/10 outline-none focus:border-[#22C55E]/30 font-bold text-xs uppercase" />
               )}
               <input type="email" placeholder="E-MAIL" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white placeholder:text-white/10 outline-none focus:border-[#22C55E]/30 font-bold text-xs uppercase" />
               <input type="password" placeholder="SENHA" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white placeholder:text-white/10 outline-none focus:border-[#22C55E]/30 font-bold text-xs uppercase" />
               
               {authMode === 'login' && (
                 <div className="text-right px-2 pt-1">
                   <button type="button" onClick={() => setAuthMode('forgot')} className="text-[9px] font-bold text-white/20 hover:text-[#22C55E] transition-colors uppercase">Esqueci minha senha</button>
                 </div>
               )}

               <button type="submit" disabled={loading} className="w-full mt-6 py-1.5 rounded-full bg-[#22C55E] text-black font-black text-[11px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#22C55E]/20 flex items-center justify-center gap-4 group disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      {authMode === 'login' ? 'Entrar Agora' : 'Criar Conta VIP'}
                      <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center group-hover:rotate-[45deg] transition-all duration-500">
                        <ArrowRight className="w-4 h-4 group-hover:rotate-[-45deg] transition-all duration-500" />
                      </div>
                    </>
                  )}
               </button>
            </form>

            <div className="mt-10 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-white/30 hover:text-white transition-colors uppercase">
                {authMode === 'login' ? 'Criar Conta' : 'Voltar para Login'}
              </button>
            </div>
            <p className="mt-12 text-[8px] text-center text-white/10 uppercase font-medium leading-relaxed">MayNutri • VIP Experience • SSL Secure</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
