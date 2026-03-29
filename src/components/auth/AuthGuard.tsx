"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AuthModal } from "@/components/auth/AuthModal";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userState, setUserState] = useState<any>(undefined);

  useEffect(() => {
    setMounted(true);
    
    // Global Event Listener for Auth Modal
    const handleOpenAuth = () => setIsAuthOpen(true);
    window.addEventListener("open-auth", handleOpenAuth);
    return () => window.removeEventListener("open-auth", handleOpenAuth);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUserState(user);
      
      if (!user) {
        if (pathname !== "/" && pathname !== "/termos" && pathname !== "/privacidade") {
           setIsAuthOpen(true);
        }
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const userData = snap.data();
          
          if (userData.status === "BANNED") {
            const { signOut } = await import("firebase/auth");
            await signOut(auth);
            window.location.href = "/";
            return;
          }

          if (!userData.profileComplete && pathname !== "/cadastro/completar") {
            router.push("/cadastro/completar");
            return;
          }

          if (
            userData.profileComplete && 
            userData.status !== "ACTIVE" && 
            pathname !== "/espera" &&
            pathname !== "/admin"
          ) {
            router.push("/espera");
          }
        } else {
          if (pathname !== "/cadastro/completar") {
            router.push("/cadastro/completar");
          }
        }
      } catch (err) {
        console.error("AuthGuard check failed:", err);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const handleClose = () => {
    setIsAuthOpen(false);
    // If they cancel out of login on a protected route, send to home
    if (!userState && pathname !== "/" && pathname !== "/termos" && pathname !== "/privacidade") {
      router.push("/");
    }
  };

  if (!mounted) return <>{children}</>;

  const isProtected = pathname !== "/" && pathname !== "/termos" && pathname !== "/privacidade";
  const shouldBlockRender = !userState && isProtected;

  return (
    <>
      {/* If logging into protected route but canceled, we wait for redirect. We can blur/hide it. */}
      {shouldBlockRender ? (
         <div className="fixed inset-0 bg-[#09090b] z-40" />
      ) : (
         children
      )}

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={handleClose} 
        onSuccess={() => setIsAuthOpen(false)}
      />
    </>
  );
}
