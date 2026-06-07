"use client";

import { useState, useEffect } from "react";
import { Calendar, LayoutDashboard, Settings, User as UserIcon, Shield, Camera, Music, Sparkles, Heart, Zap, Star, Coffee, Ghost, Rocket, Crown, Gamepad, Compass, Anchor, Moon, Sun, Cloud, Umbrella, Flower, Leaf, Flame, Droplet, Snowflake } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

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

export function AppSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const [userEmail, setUserEmail] = useState<string>("Loading...");
  const [profileIcon, setProfileIcon] = useState<string>("user");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || "Creator");
        const { data } = await supabase.from("profiles").select("icon").eq("id", session.user.id).single();
        if (data && data.icon) {
          setProfileIcon(data.icon);
        }
      }
    };
    fetchUser();
  }, []);

  const items = [
    {
      title: "Calendar",
      id: "calendar",
      icon: Calendar,
    },
    {
      title: "Board",
      id: "board",
      icon: LayoutDashboard,
    },
  ];

  return (
    <Sidebar className="border-r border-border/50 bg-card/40 backdrop-blur-3xl">
      <SidebarHeader className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">CreatorOS</h1>
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground/70 mb-2 font-semibold">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`rounded-xl transition-all duration-200 py-6 px-4 mb-2 cursor-pointer ${
                      activeTab === item.id 
                        ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-400" 
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-indigo-400" : ""}`} />
                      <span className="font-semibold">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 mt-auto">
        <div 
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-3 p-3 rounded-2xl border border-border/50 hover:bg-card/80 transition-colors cursor-pointer ${activeTab === "profile" ? "bg-indigo-500/10 border-indigo-500/50" : "bg-card/40"}`}
        >
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/50 flex items-center justify-center shrink-0 shadow-lg overflow-hidden bg-muted">
            <img 
              src={ICONS.find(i => i.id === profileIcon)?.url || ICONS[0].url} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-foreground">{userEmail}</span>
            <span className="text-xs text-muted-foreground">Pro Creator</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
