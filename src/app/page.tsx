"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Globe, Lock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-8 h-8 animate-pulse text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Navbar */}
      <nav className="w-full p-6 flex items-center justify-between relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">ContentEngine</span>
        </div>
        <Button onClick={() => router.push("/auth")} variant="ghost" className="font-semibold hidden md:flex hover:bg-muted/50">
          Sign In
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
          <Zap className="w-4 h-4" /> The Ultimate Creator OS
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Manage your content empire from <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">one dashboard.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Plan, schedule, and automate your social media across all platforms. Connect your accounts and streamline your entire creative workflow.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button onClick={() => router.push("/auth")} size="lg" className="h-14 px-8 text-base font-bold bg-white text-black hover:bg-white/90 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
            Get Started <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button onClick={() => router.push("/auth")} variant="outline" size="lg" className="h-14 px-8 text-base font-bold rounded-full border-border/50 hover:bg-muted/50">
            View Features
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left w-full">
          <div className="p-8 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
            <Globe className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Cross-Platform</h3>
            <p className="text-muted-foreground">Post to Instagram, YouTube, Reddit, X, and more from a single interface.</p>
          </div>
          <div className="p-8 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm hover:border-purple-500/50 transition-colors">
            <Zap className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Automated Workflows</h3>
            <p className="text-muted-foreground">Connect your APIs directly to automate your content distribution completely.</p>
          </div>
          <div className="p-8 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm hover:border-pink-500/50 transition-colors">
            <Lock className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Secure Storage</h3>
            <p className="text-muted-foreground">Store your media securely with Supabase. Built-in library management.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
