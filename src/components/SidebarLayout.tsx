"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Settings, User as UserIcon, FolderOpen, PieChart, PanelLeftClose, Sparkles } from "lucide-react";
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
  SidebarTrigger,
  useSidebar
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
  const { toggleSidebar, state } = useSidebar();

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
      title: "Dashboard",
      id: "dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Library",
      id: "library",
      icon: FolderOpen,
    },
    {
      title: "Analytics",
      id: "analytics",
      icon: PieChart,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/40 backdrop-blur-3xl group-data-[collapsible=icon]:w-16">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        {state === "expanded" && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Content</span>
          </div>
        )}
        <SidebarTrigger className={state === "collapsed" ? "mt-2" : ""} />
      </SidebarHeader>
      
      <SidebarContent className="px-3 mt-4">
        <SidebarGroup>
          {state === "expanded" && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-2 font-semibold">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    tooltip={item.title}
                    className={`rounded-xl transition-all duration-200 py-5 cursor-pointer group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:justify-center ${
                      activeTab === item.id 
                        ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-400" 
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${activeTab === item.id ? "text-indigo-400" : ""}`} />
                    {state === "expanded" && <span className="font-semibold text-sm">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto mb-2">
        <div 
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-3 p-2 rounded-xl border border-border/50 hover:bg-card/80 transition-colors cursor-pointer group-data-[collapsible=icon]:justify-center ${activeTab === "profile" ? "bg-indigo-500/10 border-indigo-500/50" : "bg-card/40"}`}
        >
          <div className="w-8 h-8 rounded-full border border-indigo-500/50 flex items-center justify-center shrink-0 shadow-md overflow-hidden bg-muted">
            <img 
              src={ICONS.find(i => i.id === profileIcon)?.url || ICONS[0].url} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold truncate text-foreground">{userEmail}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
