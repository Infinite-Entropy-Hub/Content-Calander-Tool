"use client";

import { PremiumWorkspace } from "@/components/PremiumWorkspace";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        if (error) await supabase.auth.signOut();
        router.push("/auth");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-background">
      <PremiumWorkspace />
    </main>
  );
}
