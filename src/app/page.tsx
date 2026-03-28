"use client";

import { Hero } from "@/components/hero";
import { Cart } from "@/components/cart";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();
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
      // Guest user, prompt login/register via global modal
      window.dispatchEvent(new CustomEvent("open-auth"));
    }
  };

  return (
    <main className="min-h-screen md:h-screen md:overflow-hidden relative flex flex-col">
      <Hero onExploreClick={handleExploreClick} />
      <Cart />
    </main>
  );
}
