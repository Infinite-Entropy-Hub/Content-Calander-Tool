"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Globe, Lock, Play, Image as ImageIcon, CalendarDays, CheckCircle2, Rocket, Share2, UploadCloud } from "lucide-react";
import Image from "next/image";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806539/Instagram_Logo_y6kb4h.png" },
  { id: "facebook", name: "Facebook", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780818031/facebook_c4ih7y.png" },
  { id: "youtube", name: "YouTube", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/YT_cvh8mb.png" },
  { id: "x", name: "X (Twitter)", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/X_Logo_bw3isl.png" },
];

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Sparkles className="w-8 h-8 animate-pulse text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{
             backgroundImage: `linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }} 
      />
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-400/20 blur-[120px] rounded-full pointer-events-none z-0" style={{ animationDelay: "2s" }} />

      {/* Navbar */}
      <nav className="w-full p-6 flex items-center justify-between relative z-10 max-w-7xl mx-auto backdrop-blur-md bg-white/30 rounded-b-3xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">ContentEngine</span>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/auth")} variant="ghost" className="font-bold hidden md:flex hover:bg-slate-200/50 text-slate-700">
            Sign In
          </Button>
          <Button onClick={() => router.push("/auth")} className="font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 shadow-lg shadow-slate-900/20">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-600 text-sm font-bold mb-10 animate-fade-in-up">
          <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> The Ultimate Creator OS
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] text-slate-900">
          Post everywhere.<br/>
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Do it once.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-14 font-medium leading-relaxed">
          The most powerful, beautifully designed content calendar. Schedule Shorts, Reels, Threads, and Tweets simultaneously with intelligent cross-posting and one central media library.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Button onClick={() => router.push("/auth")} size="lg" className="h-16 px-10 text-lg font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 rounded-full shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 hover:-translate-y-1">
            Start Automating <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>

        {/* Floating Icons Display */}
        <div className="mt-24 relative w-full h-32 flex justify-center items-center gap-8 md:gap-16">
          {PLATFORMS.map((platform, i) => (
            <div 
              key={platform.id} 
              className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 relative"
              style={{
                animation: `bounce ${2 + i * 0.5}s infinite alternate ease-in-out`
              }}
            >
              <img src={platform.logo} alt={platform.name} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              {i % 2 === 0 && <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
            </div>
          ))}
        </div>
      </main>

      {/* Bento Grid Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Everything you need. <span className="text-indigo-500">Nothing you don't.</span></h2>
          <p className="text-xl text-slate-500 font-medium">A workflow so smooth, you'll wonder how you lived without it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[300px]">
          
          {/* Feature 1 - Large spanning */}
          <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between overflow-hidden relative group hover:border-indigo-300 transition-colors">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-3">Intelligent Cross-Posting</h3>
              <p className="text-slate-600 text-lg max-w-md">Upload a Reel and automatically format it for YouTube Shorts and Facebook Page Reels with one toggle. We handle the API complexities.</p>
            </div>
            <div className="absolute right-[-10%] bottom-[-20%] w-[60%] h-[80%] bg-gradient-to-tl from-indigo-50 to-white border border-indigo-100 rounded-tl-3xl shadow-2xl p-6 rotate-[-5deg] group-hover:rotate-0 transition-all duration-500 hidden md:block">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                  <img src={PLATFORMS[0].logo} className="w-6 h-6" /> <span className="font-bold text-sm">Post to Reels</span> <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                  <img src={PLATFORMS[2].logo} className="w-6 h-6" /> <span className="font-bold text-sm">Post to Shorts</span> <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-3">Visual Calendar</h3>
              <p className="text-slate-300 text-lg">Drag, drop, and plan your entire month. See your content strategy at a glance with beautiful color-coded cards.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-pink-300 transition-colors">
            <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-6">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black mb-3">Media Library</h3>
            <p className="text-slate-600 text-lg">Store all your videos and images in one secure cloud. Attach multiple files to a single post for seamless Carousels.</p>
          </div>

          {/* Feature 4 - Large spanning */}
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-xl">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-black mb-3">1-Click Auto Publish</h3>
              <p className="text-white/80 text-lg mb-6">Connect your developer APIs once, and never manually post again. Our engine talks directly to Twitter, Meta, and Google so you can focus on creating.</p>
              <Button onClick={() => router.push("/auth")} className="bg-white text-indigo-600 font-bold hover:bg-slate-50 rounded-full px-8 shadow-lg">
                Setup APIs Now
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* How it works Steps */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-24 border-t border-slate-200/60 mt-10">
        <h2 className="text-4xl font-black text-center mb-16 text-slate-900">How it Works</h2>
        <div className="space-y-12 relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent rounded-full -ml-0.5 opacity-20" />
          
          {[
            { step: "01", title: "Connect Platforms", desc: "Link your YouTube, Instagram, Facebook, and X accounts through our secure API dashboard.", icon: <Globe className="w-6 h-6" /> },
            { step: "02", title: "Upload Media", desc: "Drop your raw videos and images into the centralized cloud library. They'll be ready for any post.", icon: <UploadCloud className="w-6 h-6" /> },
            { step: "03", title: "Draft & Cross-Post", desc: "Write one caption, select multiple platforms, and let our system format it for Reels, Shorts, or Tweets.", icon: <Sparkles className="w-6 h-6" /> },
            { step: "04", title: "Publish or Schedule", desc: "Hit publish to send to all platforms instantly, or drop it on the calendar for later.", icon: <Play className="w-6 h-6" /> }
          ].map((item, i) => (
            <div key={i} className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-white shadow-xl shadow-indigo-500/10 border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xl z-10">
                {item.step}
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex-1 relative hover:shadow-xl hover:border-indigo-200 transition-all">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 shadow-sm border border-white">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative z-10 w-full bg-slate-900 py-20 px-4 mt-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to dominate your niche?</h2>
          <p className="text-xl text-slate-400 mb-10">Join the creators who are automating their empire.</p>
          <Button onClick={() => router.push("/auth")} size="lg" className="h-16 px-12 text-lg font-black bg-white text-slate-900 hover:bg-slate-100 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform hover:scale-105">
            Launch Your Calendar
          </Button>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-15px); }
        }
      `}} />
    </div>
  );
}
