"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const AVATARS = [
  ...Array.from({ length: 12 }, (_, i) => `rm_${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `db_micah_${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `db_adv_${i + 1}`)
];

export default function AuthPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [action, setAction] = useState<"login" | "signup">("login");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [source, setSource] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleNextStep = () => {
    if (!email || !password) {
      setError("Please fill out email and password.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let res;
      if (action === "signup") {
        res = await supabase.auth.signUp({ email, password });
        if (!res.error && res.data.user) {
          // Assign random avatar
          const randomIcon = AVATARS[Math.floor(Math.random() * AVATARS.length)];
          
          await supabase.from("profiles").insert([{ 
            id: res.data.user.id, 
            email: res.data.user.email,
            name,
            country,
            source,
            icon: randomIcon
          }]);
        }
      } else {
        res = await supabase.auth.signInWithPassword({ email, password });
      }

      if (res.error) throw res.error;

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="absolute top-0 w-full h-[500px] bg-indigo-500/10 blur-[150px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden">
        
        {/* Wizard Progress Indicator */}
        {action === "signup" && (
          <div className="absolute top-0 left-0 w-full h-1 bg-border/50">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        )}

        <div className="text-center mb-8 mt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">CreatorOS</h1>
          <p className="text-muted-foreground mt-2">
            {action === "login" ? "Sign in to manage your content pipeline" : step === 1 ? "Create your account" : "Tell us about yourself"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Step 1: Login / Email Password */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="creator@example.com" 
                className="bg-background/50 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-background/50 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-4 space-y-3">
              {action === "login" ? (
                <>
                  <Button 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    onClick={handleAuth}
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                    {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-border/50 bg-card hover:bg-muted"
                    onClick={() => { setAction("signup"); setError(null); }}
                  >
                    Create Account Instead
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    onClick={handleNextStep}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 text-muted-foreground hover:text-foreground"
                    onClick={() => { setAction("login"); setError(null); }}
                  >
                    Already have an account?
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Personal Details (Signup Only) */}
        {step === 2 && action === "signup" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="Jane Doe" 
                className="bg-background/50 h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input 
                placeholder="United States" 
                className="bg-background/50 h-12"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>How did you hear about us?</Label>
              <Input 
                placeholder="Twitter, YouTube, Friend..." 
                className="bg-background/50 h-12"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                variant="outline"
                className="h-12 w-12 shrink-0 p-0 border-border/50 bg-card hover:bg-muted"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button 
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                onClick={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
