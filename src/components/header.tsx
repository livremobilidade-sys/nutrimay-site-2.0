"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BatchStatusBar } from "./shop/BatchStatusBar";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, ShieldCheck, ChevronDown, LogIn, Share2, Package } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
         try {
           const snap = await getDoc(doc(db, "users", currentUser.uid));
           if (snap.exists()) setUserData(snap.data());
         } catch(e) {}
      } else {
         setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Force full redirect to Home/Hero ensuring a fresh clean state
      window.location.href = "/";
    } catch (err) {
      console.error("Erro logout:", err);
    }
  };

  if (pathname === "/checkout") return null;

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "V";

  return (
    <header className="fixed top-0 z-50 w-full bg-[#1a1a1c]/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-18 md:h-20 flex items-center justify-between">
        
        {/* Brand */}
        <Link 
          href={userData?.status === 'PENDING' ? '/espera' : '/'} 
          onClick={(e) => {
            if (userData?.status === 'PENDING') {
              e.preventDefault();
            }
          }}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <motion.div layoutId="brand-logo-container" className="flex items-baseline relative z-10 whitespace-nowrap">
            <span className="font-bold text-2xl md:text-3xl tracking-tight text-white">May</span>
            <span className="font-light text-2xl md:text-3xl tracking-tight text-white pr-1">Nutri</span>
            <div className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] bg-[#22C55E]" />
          </motion.div>
        </Link>

        <div className="flex items-center gap-6 ml-auto">
          {/* Status Bar */}
          <BatchStatusBar />

          {/* User Profile / Auth Toggle */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setShowMenu(!showMenu)}
                   className="flex items-center gap-3 p-1 px-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group"
                 >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-[10px] font-black text-white/30">
                       {user.photoURL ? (
                          <img src={user.photoURL} className="w-full h-full object-cover" />
                       ) : (
                          getInitials(user.displayName || "VIP")
                       )}
                    </div>
                    <ChevronDown className={`w-3 h-3 text-white/20 group-hover:text-white transition-all ${showMenu ? 'rotate-180' : ''}`} />
                 </button>

                 <AnimatePresence>
                    {showMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-64 bg-[#0c0c0e] border border-white/10 rounded-3xl p-4 shadow-2xl z-[100] backdrop-blur-3xl"
                      >
                         <div className="px-4 py-3 border-b border-white/5 mb-2">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Membro Conectado</p>
                            <p className="text-sm font-bold text-white truncate">{user.displayName || "Explorador VIP"}</p>
                         </div>
                         
                         <Link 
                           href="/cadastro/completar" 
                           onClick={() => setShowMenu(false)}
                           className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group"
                         >
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Meu Cadastro</span>
                         </Link>

                          <button 
                            onClick={() => {
                              setShowMenu(false);
                              router.push("/cadastro/completar#convite");
                            }}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-[#22C55E]/10 text-white/60 hover:text-[#22C55E] transition-all group text-left"
                          >
                             <Share2 className="w-4 h-4" />
                             <span className="text-xs font-bold uppercase tracking-widest">Convidar Amigos</span>
                          </button>

                          <Link 
                            href="/pedidos" 
                            onClick={() => setShowMenu(false)}
                            className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white transition-all group"
                          >
                             <Package className="w-4 h-4" />
                             <span className="text-xs font-bold uppercase tracking-widest">Meus Pedidos</span>
                          </Link>

                          {['evari.may@gmail.com', 'evaristosilvalima@gmail.com'].includes(user.email) && ( // Lista VIP de Admins Autorizados
                            <Link 
                              href="/admin" 
                              onClick={() => setShowMenu(false)}
                              className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 text-[#22C55E] group"
                            >
                               <ShieldCheck className="w-4 h-4" />
                               <span className="text-xs font-bold uppercase tracking-widest">Gestão MayNutri</span>
                            </Link>
                         )}

                         <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all mt-2 group"
                         >
                            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Sair do Site</span>
                         </button>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            ) : pathname !== "/" ? (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth'))}
                className="flex items-center gap-3 px-6 py-2 bg-[#22C55E] text-black text-[10px] font-black uppercase rounded-full hover:scale-105 transition-all shadow-xl shadow-[#22C55E]/10"
              >
                <LogIn className="w-3 h-3" /> Entrar VIP
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
