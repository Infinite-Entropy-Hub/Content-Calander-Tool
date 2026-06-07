"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/SidebarLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { User, Shield, Camera, Music, Sparkles, Heart, Zap, Star, Coffee, Ghost, Rocket, Crown, Gamepad, Compass, Anchor, Moon, Sun, Cloud, Umbrella, Flower, Leaf, Flame, Droplet, Snowflake, Key, Info } from "lucide-react";
import { PLATFORMS } from "@/components/NewPostDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ICONS = [
  // Rick and Morty
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `rm_${i + 1}`,
    url: `https://rickandmortyapi.com/api/character/avatar/${i + 1}.jpeg`
  })),
  // Family Guy / Cartoon Style (Micah)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `db_micah_${i + 1}`,
    url: `https://api.dicebear.com/7.x/micah/svg?seed=${i + 15}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  })),
  // Adventurer / Ninja Style
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `db_adv_${i + 1}`,
    url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${i + 30}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  }))
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isYTGuideOpen, setIsYTGuideOpen] = useState(false);
  const [isXGuideOpen, setIsXGuideOpen] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setUser(session.user);
      
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (data) {
        setProfile(data);
      }
    };
    fetchUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const saveIcon = async (iconId: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.from("profiles").upsert({ id: user.id, icon: iconId, email: user.email });
      setProfile({ ...profile, icon: iconId });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const saveApiKey = async () => {
    if (!user || !selectedPlatform) return;
    setIsSaving(true);
    try {
      const currentKeys = profile?.api_keys || {};
      const newKeys = { ...currentKeys, [selectedPlatform.id]: apiKeyInput };
      
      await supabase.from("profiles").update({ api_keys: newKeys }).eq("id", user.id);
      setProfile({ ...profile, api_keys: newKeys });
      setIsDialogOpen(false);
      setApiKeyInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const activeIconData = ICONS.find(i => i.id === (profile?.icon || "rm_1")) || ICONS[0];

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <AppSidebar activeTab="profile" setActiveTab={(tab) => router.push("/dashboard")} />
        
        <main className="flex-1 overflow-auto relative p-8">
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Your Identity & Settings</h1>
              <p className="text-muted-foreground mt-2">Customize your avatar and connect your integrations</p>
            </div>

            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 flex items-center gap-8 shadow-xl">
              <div className="w-32 h-32 rounded-full border-4 border-indigo-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)] overflow-hidden">
                <img src={activeIconData.url} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.email}</h2>
                <p className="text-muted-foreground mt-1">Authenticated via Supabase</p>
                <Button variant="destructive" className="mt-4" onClick={handleSignOut}>Sign Out</Button>
              </div>
            </div>

            {/* Integrations Section */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" /> Platform Integrations
              </h3>
              <p className="text-sm text-muted-foreground mb-6">Connect your social accounts securely by providing your Access Tokens / API keys.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PLATFORMS.map((platform) => {
                  const isConnected = !!profile?.api_keys?.[platform.id];
                  
                  return (
                    <div 
                      key={platform.id}
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setApiKeyInput(profile?.api_keys?.[platform.id] || "");
                        setIsDialogOpen(true);
                      }}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center ${
                        isConnected 
                          ? "bg-green-500/10 border-green-500/50 hover:bg-green-500/20" 
                          : "bg-card/40 border-border/50 hover:bg-muted"
                      }`}
                    >
                      {['instagram', 'facebook'].includes(platform.id) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-background/50 hover:bg-blue-500 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); setIsGuideOpen(true); }}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {platform.id === 'youtube' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-background/50 hover:bg-red-500 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); setIsYTGuideOpen(true); }}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {platform.id === 'x' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-background/50 hover:bg-zinc-800 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); setIsXGuideOpen(true); }}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <img src={platform.logo} alt={platform.name} className="w-8 h-8 object-contain" />
                      <div>
                        <p className="text-sm font-bold">{platform.name}</p>
                        <p className={`text-[10px] font-semibold mt-1 uppercase tracking-wider ${isConnected ? "text-green-400" : "text-muted-foreground"}`}>
                          {isConnected ? "Connected" : "Not Connected"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Avatar Section */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Choose Your Avatar
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-9 gap-4">
                {ICONS.map((item) => {
                  const isActive = profile?.icon === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => saveIcon(item.id)}
                      disabled={isSaving}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
                        isActive 
                          ? "ring-4 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110" 
                          : "border-2 border-transparent hover:border-border/50 hover:scale-105 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={item.url} alt={`Avatar ${item.id}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
            
          </div>
        </main>
        
        {/* API Key Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-3xl border border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Connect {selectedPlatform?.name}
              </DialogTitle>
              <DialogDescription>
                Enter your secure Access Token or API Key for {selectedPlatform?.name}. This is stored securely in your Supabase database.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>API Key / Access Token</Label>
                <Input 
                  type="password" 
                  placeholder="Paste your token here..." 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveApiKey} disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                {isSaving ? "Saving..." : "Save Connection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Meta Setup Guide Dialog */}
        <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
          <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-3xl border border-border/50 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Info className="w-5 h-5 text-blue-400" />
                How to get your Meta Access Token
              </DialogTitle>
              <DialogDescription>
                Follow these exact steps to connect your Instagram and Facebook Page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm text-foreground/90">
              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 1: Create the App</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to <a href="https://developers.facebook.com/" target="_blank" className="text-indigo-400 underline">developers.facebook.com</a> and click My Apps.</li>
                  <li>Click Create App. Select "Other" {">"} "None" (Flexible App).</li>
                  <li>Name it (e.g., ContentEngine Automation).</li>
                  <li>On the App Dashboard, scroll down and click "Set Up" for <b>Instagram Graph API</b> and <b>Facebook Login for Business</b>.</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 2: Create a System User</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to your Business Settings (<a href="https://business.facebook.com/settings" target="_blank" className="text-indigo-400 underline">business.facebook.com/settings</a>).</li>
                  <li>On the left menu, under Users, click <b>System users</b>.</li>
                  <li>Click the blue <b>+ Add</b> button in the top right.</li>
                  <li>Name it (e.g., ContentEngine Robot) and set the Role to <b>Employee</b>.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 3: Assign Assets</h4>
                <p className="pl-5 text-xs text-muted-foreground mb-1">We must tell the robot what it is allowed to touch.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Click on your new System User, then click the giant <b>Assign assets</b> button in the middle.</li>
                  <li>Click <b>Apps</b> on the left, check your App, and turn ON "Manage App".</li>
                  <li>Click <b>Instagram Accounts</b> on the left, check your Instagram, and turn ON "Content".</li>
                  <li>Click <b>Pages</b> on the left, check your connected Facebook Page, and turn ON "Content".</li>
                  <li>Click Save Changes.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 4: Generate the Token</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>While still on the System User page, click <b>Generate Token</b>.</li>
                  <li>Select your App from the dropdown.</li>
                  <li>Check these 4 boxes: <code className="bg-muted px-1 rounded text-xs text-indigo-300">instagram_basic</code>, <code className="bg-muted px-1 rounded text-xs text-indigo-300">instagram_content_publish</code>, <code className="bg-muted px-1 rounded text-xs text-indigo-300">pages_show_list</code>, and <code className="bg-muted px-1 rounded text-xs text-indigo-300">pages_read_engagement</code>.</li>
                  <li>Generate the token, copy the long string of text, and paste it into this dashboard!</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button onClick={() => setIsGuideOpen(false)} className="bg-indigo-500 hover:bg-indigo-600 text-white">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* YouTube Setup Guide Dialog */}
        <Dialog open={isYTGuideOpen} onOpenChange={setIsYTGuideOpen}>
          <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-3xl border border-border/50 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Info className="w-5 h-5 text-red-500" />
                How to get your YouTube Refresh Token
              </DialogTitle>
              <DialogDescription>
                Follow these steps to generate a permanent token for automated YouTube uploads.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm text-foreground/90">
              <div className="space-y-2">
                <h4 className="font-bold text-red-400">Step 1: Google Cloud Project</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-indigo-400 underline">console.cloud.google.com</a> and create a new Project.</li>
                  <li>In the search bar, type <b>YouTube Data API v3</b> and click Enable.</li>
                  <li>Go to <b>Credentials</b> on the left menu.</li>
                  <li>Click <b>Create Credentials</b> {">"} <b>OAuth client ID</b>. (Choose Web Application).</li>
                  <li>Add <code className="bg-muted px-1 rounded text-xs">https://developers.google.com/oauthplayground</code> to Authorized redirect URIs.</li>
                  <li>Save and copy your <b>Client ID</b> and <b>Client Secret</b> into your `.env.local` file as <code className="bg-muted px-1 rounded text-xs text-indigo-300">YOUTUBE_CLIENT_ID</code> and <code className="bg-muted px-1 rounded text-xs text-indigo-300">YOUTUBE_CLIENT_SECRET</code>.</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-red-400">Step 2: Get Refresh Token via Playground</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to the <a href="https://developers.google.com/oauthplayground/" target="_blank" className="text-indigo-400 underline">Google OAuth 2.0 Playground</a>.</li>
                  <li>Click the Gear Icon (top right) and check <b>Use your own OAuth credentials</b>. Paste your Client ID and Secret there.</li>
                  <li>On the left, scroll down to <b>YouTube Data API v3</b> and select <code className="bg-muted px-1 rounded text-xs">https://www.googleapis.com/auth/youtube.upload</code>.</li>
                  <li>Click <b>Authorize APIs</b> and log in with the Google Account you want to post to.</li>
                  <li>Click <b>Exchange authorization code for tokens</b>.</li>
                  <li>Copy the <b>Refresh Token</b> and paste it into this dashboard!</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button onClick={() => setIsYTGuideOpen(false)} className="bg-red-500 hover:bg-red-600 text-white">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* X (Twitter) Setup Guide Dialog */}
        <Dialog open={isXGuideOpen} onOpenChange={setIsXGuideOpen}>
          <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-3xl border border-border/50 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Info className="w-5 h-5 text-zinc-400" />
                How to configure X (Twitter) API
              </DialogTitle>
              <DialogDescription>
                Follow these steps to generate Developer credentials for automated Tweeting.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm text-foreground/90">
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-300">Step 1: Developer Portal</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to <a href="https://developer.x.com/en/portal/dashboard" target="_blank" className="text-indigo-400 underline">developer.x.com</a> and sign up.</li>
                  <li>Sign up for the <b>Free Tier</b> (allows 1,500 posts/month).</li>
                  <li>Create a new Project and a new App.</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-300">Step 2: Change App Permissions</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Inside your App settings, find <b>User authentication settings</b> and click Edit.</li>
                  <li>Set the App permissions to <b>Read and write</b>. (This is required to post!).</li>
                  <li>For Type of App, select <b>Web App, Automated App or Bot</b>.</li>
                  <li>Enter dummy URLs for Callback and Website if required.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-zinc-300">Step 3: Generate the 4 Keys</h4>
                <p className="text-xs text-muted-foreground">Because Twitter requires 4 keys, we store them directly in the environment variables instead of this UI dashboard.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to the <b>Keys and Tokens</b> tab of your App.</li>
                  <li>Click Regenerate on the <b>Consumer Keys</b>.</li>
                  <li>Copy them into your `.env.local` file as <code className="bg-muted px-1 rounded text-xs text-indigo-300">TWITTER_API_KEY</code> and <code className="bg-muted px-1 rounded text-xs text-indigo-300">TWITTER_API_SECRET</code>.</li>
                  <li>Click Generate on the <b>Authentication Tokens (Access Token and Secret)</b>.</li>
                  <li>Copy them into your `.env.local` file as <code className="bg-muted px-1 rounded text-xs text-indigo-300">TWITTER_ACCESS_TOKEN</code> and <code className="bg-muted px-1 rounded text-xs text-indigo-300">TWITTER_ACCESS_SECRET</code>.</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button onClick={() => setIsXGuideOpen(false)} className="bg-zinc-800 hover:bg-zinc-900 text-white">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
        
      </div>
    </SidebarProvider>
  );
}
