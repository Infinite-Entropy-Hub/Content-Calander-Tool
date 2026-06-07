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
import { toast } from "sonner";

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
  })),
  // Custom Anime
  { id: 'anime_doraemon', url: 'https://upload.wikimedia.org/wikipedia/en/b/bd/Doraemon_character.png' },
  { id: 'anime_shinchan', url: 'https://upload.wikimedia.org/wikipedia/en/6/64/Crayon_Shin-chan.png' },
  { id: 'anime_pikachu', url: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png' },
  { id: 'anime_spongebob', url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/SpongeBob_SquarePants_character.svg' },
  { id: 'anime_goku', url: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Goku_in_Dragon_Ball_Super.png' }
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [apiKeysObj, setApiKeysObj] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isYTGuideOpen, setIsYTGuideOpen] = useState(false);
  const [isXGuideOpen, setIsXGuideOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  const [notificationEmail, setNotificationEmail] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  
  const [isNotificationGuideOpen, setIsNotificationGuideOpen] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  
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
        setNotificationEmail(data.notification_email || "");
        setTelegramChatId(data.telegram_chat_id || "");
        setTelegramEnabled(data.telegram_enabled || false);
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
      setIsAvatarModalOpen(false); // Close modal on selection
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
      const valueToSave = ['instagram', 'facebook'].includes(selectedPlatform.id) 
        ? apiKeysObj.token 
        : apiKeysObj;
        
      const newKeys = { ...currentKeys, [selectedPlatform.id]: valueToSave };
      
      await supabase.from("profiles").update({ api_keys: newKeys }).eq("id", user.id);
      setProfile({ ...profile, api_keys: newKeys });
      setIsDialogOpen(false);
      setApiKeysObj({});
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.from("profiles").update({
        notification_email: notificationEmail,
        telegram_chat_id: telegramChatId,
        telegram_enabled: telegramEnabled
      }).eq("id", user.id);
      
      setProfile({ 
        ...profile, 
        notification_email: notificationEmail, 
        telegram_chat_id: telegramChatId, 
        telegram_enabled: telegramEnabled
      });
      toast.success("Notification settings saved!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const testNotifications = async () => {
    if (!notificationEmail && !telegramChatId) {
      toast.error("Please enter an email or Telegram Chat ID first!");
      return;
    }
    
    // Auto save first just in case
    await saveNotifications();

    setIsTestingNotification(true);
    try {
      const res = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notificationEmail, telegramChatId })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send test notifications");
      
      toast.success("Test notifications sent successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(`Error: ${e.message}`);
    } finally {
      setIsTestingNotification(false);
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

            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 flex items-center gap-8 shadow-xl relative overflow-hidden group">
              <div 
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-32 h-32 rounded-full border-4 border-indigo-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)] overflow-hidden cursor-pointer relative transition-transform hover:scale-105"
              >
                <img src={activeIconData.url} alt="Profile" className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.email}</h2>
                <p className="text-muted-foreground mt-1">Authenticated via Supabase</p>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10" onClick={() => setIsAvatarModalOpen(true)}>Change Avatar</Button>
                  <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
                </div>
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
                        const currentVal = profile?.api_keys?.[platform.id];
                        if (typeof currentVal === 'object' && currentVal !== null) {
                          setApiKeysObj(currentVal);
                        } else if (typeof currentVal === 'string') {
                          setApiKeysObj({ token: currentVal });
                        } else {
                          setApiKeysObj({});
                        }
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

            {/* Notification Settings */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl mt-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-400" /> Notification & Hybrid Automation
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Receive Telegram messages for auto-published content, and Email + Telegram alerts for manual "Hybrid" posts.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                  onClick={() => setIsNotificationGuideOpen(true)}
                >
                  <Info className="w-4 h-4 mr-2" /> How to find your Chat ID
                </Button>
              </div>
              
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label>Email Address (For Manual Post Reminders)</Label>
                  <Input 
                    placeholder="you@example.com" 
                    value={notificationEmail} 
                    onChange={e => setNotificationEmail(e.target.value)} 
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Emails are sent via Resend.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Telegram Chat ID</Label>
                  <Input 
                    placeholder="e.g. 123456789" 
                    value={telegramChatId} 
                    onChange={e => setTelegramChatId(e.target.value)} 
                    className="bg-background/50 font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this by messaging @userinfobot on Telegram.
                  </p>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border/50 bg-background/50 transition-all hover:bg-muted/50">
                  <input 
                    type="checkbox" 
                    checked={telegramEnabled} 
                    onChange={(e) => setTelegramEnabled(e.target.checked)} 
                    className="rounded bg-background accent-indigo-500 w-4 h-4" 
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Enable Telegram Notifications</span>
                    <span className="text-xs text-muted-foreground">Receive instant alerts for successful and failed posts.</span>
                  </div>
                </label>
                
                <div className="flex gap-4 pt-2">
                  <Button onClick={saveNotifications} disabled={isSaving} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                    {isSaving ? "Saving..." : "Save Notification Settings"}
                  </Button>
                  <Button onClick={testNotifications} disabled={isTestingNotification} variant="outline" className="w-full sm:w-auto border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                    {isTestingNotification ? "Sending..." : "Test Notifications"}
                  </Button>
                </div>
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
              {['instagram', 'facebook'].includes(selectedPlatform?.id) && (
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input 
                    type="password" 
                    placeholder="Paste your token here..." 
                    value={apiKeysObj.token || ''}
                    onChange={(e) => setApiKeysObj({...apiKeysObj, token: e.target.value})}
                    className="bg-background/50 border-border/50"
                  />
                </div>
              )}
              {selectedPlatform?.id === 'youtube' && (
                <>
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.clientId || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, clientId: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.clientSecret || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, clientSecret: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Refresh Token</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.refreshToken || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, refreshToken: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </>
              )}
              {selectedPlatform?.id === 'x' && (
                <>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.appKey || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, appKey: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.appSecret || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, appSecret: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.accessToken || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, accessToken: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Secret</Label>
                    <Input 
                      type="password" 
                      value={apiKeysObj.accessSecret || ''}
                      onChange={(e) => setApiKeysObj({...apiKeysObj, accessSecret: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </>
              )}
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
                <h4 className="font-bold text-blue-400">Step 1: Create the App (Using Personal Profile)</h4>
                <p className="pl-5 text-xs text-muted-foreground mb-1">Meta requires developer apps to be created by personal accounts, not business portfolios.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Ensure you are logged into your Personal Facebook Profile (that has admin access to your Business).</li>
                  <li>Go to <a href="https://developers.facebook.com/" target="_blank" className="text-indigo-400 underline">developers.facebook.com</a> and click My Apps.</li>
                  <li>Click Create App. Select "Other" {">"} "Business". Select your Business Portfolio from the dropdown.</li>
                  <li>On the App Dashboard, scroll down and click "Set Up" for <b>Instagram Graph API</b> and <b>Facebook Login for Business</b>.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 2: Create a System User</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Open a new tab and go to <a href="https://business.facebook.com/settings" target="_blank" className="text-indigo-400 underline">business.facebook.com/settings</a>.</li>
                  <li>On the left sidebar, under Users, click <b>System users</b>.</li>
                  <li>Click the blue <b>+ Add</b> button in the top right.</li>
                  <li>Name it (e.g., ContentEngine Robot) and select <b>Employee</b> (or Admin if allowed).</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 3: Assign Assets</h4>
                <p className="pl-5 text-xs text-yellow-500 mb-1">If you chose "Employee", you MUST do this step to avoid the greyed-out generate button.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Click on your new System User, then click the giant <b>Assign assets</b> button in the middle.</li>
                  <li>Click <b>Apps</b> on the left, check your App, and turn ON "Manage App (Full Control)".</li>
                  <li>Click <b>Instagram Accounts</b> on the left, check your Instagram, and turn ON "Content".</li>
                  <li>Click <b>Pages</b> on the left, check your Facebook Page, and turn ON "Content".</li>
                  <li>Click Save Changes.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-blue-400">Step 4: Generate the Permanent Token</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>While still on the System User page, click <b>Generate Token</b>.</li>
                  <li>Select your new App from the dropdown.</li>
                  <li>Check these 6 exact boxes: 
                    <div className="flex flex-wrap gap-1 mt-1 mb-1">
                      <code className="bg-muted px-1 rounded text-xs text-indigo-300">instagram_basic</code>
                      <code className="bg-muted px-1 rounded text-xs text-indigo-300">instagram_content_publish</code>
                      <code className="bg-muted px-1 rounded text-xs text-indigo-300">pages_show_list</code>
                      <code className="bg-muted px-1 rounded text-xs text-indigo-300">pages_read_engagement</code>
                      <code className="bg-muted px-1 rounded text-xs text-indigo-300">pages_manage_posts</code>
                      <code className="bg-muted px-1 rounded text-xs text-indigo-300">publish_video</code>
                    </div>
                  </li>
                  <li>Generate the token, copy the giant string of text, and paste it into this dashboard! You are done!</li>
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
                  <li>Save and copy your <b>Client ID</b> and <b>Client Secret</b> into this dashboard.</li>
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
                <h4 className="font-bold text-zinc-300">Step 1: Developer Portal & Billing</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to <a href="https://developer.x.com/en/portal/dashboard" target="_blank" className="text-indigo-400 underline">developer.x.com</a> and sign up.</li>
                  <li>Create a new Project and a new App.</li>
                  <li><span className="text-yellow-400 font-bold">Important:</span> You must have a positive credit balance to post. Click <b>Buy Credits</b> in the dashboard and add a tiny amount (like $5) to enable the API!</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-300">Step 2: Change App Permissions</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Inside your App settings (click the <b>Settings Gear icon</b>), click Edit on <b>Authentication settings</b>.</li>
                  <li>Set the App permissions to <b>Read and write</b>. (This is required to post!).</li>
                  <li>For Type of App, select <b>Web App, Automated App or Bot</b>.</li>
                  <li>Enter dummy URLs for Callback and Website, then click Save Changes.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-zinc-300">Step 3: Generate the 4 Keys</h4>
                <p className="text-xs text-muted-foreground">Twitter requires 4 keys. Copy each into this dashboard!</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to the <b>Keys and Tokens</b> tab of your App.</li>
                  <li>Click Regenerate on the <b>Consumer Keys</b> to get your API Key and API Secret.</li>
                  <li>Click Regenerate on the <b>Authentication Tokens (Access Token and Secret)</b>. (Make sure it says "Read and Write" under it after generating!)</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button onClick={() => setIsXGuideOpen(false)} className="bg-zinc-800 hover:bg-zinc-900 text-white">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Setup Guide Dialog */}
        <Dialog open={isNotificationGuideOpen} onOpenChange={setIsNotificationGuideOpen}>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-3xl border border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Zap className="w-5 h-5 text-indigo-400" />
                Find your Telegram Chat ID
              </DialogTitle>
              <DialogDescription>
                We need this ID to send you automated messages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2 text-sm text-foreground/90">
              
              <div className="space-y-2">
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Open the Telegram app on your phone or computer.</li>
                  <li>Search for the bot <b>@userinfobot</b> and tap on it.</li>
                  <li>Click <b>Start</b>. The bot will instantly reply with your `Id` (e.g., <code className="bg-muted px-1 rounded text-xs">123456789</code>).</li>
                  <li>Copy that ID and paste it into the <b>Telegram Chat ID</b> field.</li>
                  <li>
                    <i>
                      Make sure you have started a chat with our platform's official bot so it has permission to message you! <br/>
                      👉 <a href="https://t.me/postcal_bot" target="_blank" className="text-indigo-400 font-bold hover:underline">Click here to open @postcal_bot</a> and press <b>Start</b>.
                    </i>
                  </li>
                </ol>
              </div>

            </div>
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button onClick={() => setIsNotificationGuideOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Avatar Selection Dialog */}
        <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
          <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-3xl border border-border/50 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="w-6 h-6 text-indigo-400" />
                Choose Your Avatar
              </DialogTitle>
              <DialogDescription>
                Select an avatar that represents your brand or identity.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 py-4">
              {ICONS.map((item) => {
                const isActive = profile?.icon === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => saveIcon(item.id)}
                    disabled={isSaving}
                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden bg-white/5 ${
                      isActive 
                        ? "ring-4 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110 z-10" 
                        : "border-2 border-transparent hover:border-border/50 hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={item.url} alt={`Avatar ${item.id}`} className="w-full h-full object-contain p-1" />
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button onClick={() => setIsAvatarModalOpen(false)} variant="outline">Close</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </SidebarProvider>
  );
}
