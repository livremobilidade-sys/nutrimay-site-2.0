"use client";

import { Hero } from "@/components/hero";
import { Cart } from "@/components/cart";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type FlowState = "IDLE" | "AUTH" | "DONE";

export default function Home() {
  const router = useRouter();
  const [flow, setFlow] = useState<FlowState>("IDLE");
  const [user, setUser] = useState<any>(null);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleExploreClick = () => {
    if (user) {
      // User is already logged in, take them to the store
      router.push("/produtos");
    } else {
      // Guest user, prompt login/register
      setFlow("AUTH");
    }
  };

  const handleAuthSuccess = () => {
    // After login, usually they should complete profile or go to products
    // Since we have a redirect logic in AuthModal to /cadastro/completar, 
    // it will handle the next step automatically. 
    // But for the Home component, we just close the modal.
    setFlow("IDLE");
    router.push("/produtos");
  };

  return (
    <main className="min-h-screen md:h-screen md:overflow-hidden relative flex flex-col">
      <Hero onExploreClick={handleExploreClick} />
      <Cart />

      {/* Auth Modal Triggered by Hero Button */}
      <AuthModal 
        isOpen={flow === "AUTH"} 
        onClose={() => setFlow("IDLE")} 
        onSuccess={handleAuthSuccess}
      />

    </main>
  );
}
