"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If no user, they can wander public pages as usual.
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const userData = snap.data();
          
          // If profile is incomplete, force them strictly to completion page
          if (!userData.profileComplete && pathname !== "/cadastro/completar") {
            router.push("/cadastro/completar");
            return;
          }

          // If profile is complete but status is STILL PENDING, TRAP them in /espera
          if (
            userData.profileComplete && 
            userData.status !== "ACTIVE" && 
            pathname !== "/espera" &&
            pathname !== "/admin" // optional if you want admin bypass
          ) {
            router.push("/espera");
          }
        } else {
          // If logged in but document doesn't exist yet, force to `/cadastro/completar`.
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

  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
