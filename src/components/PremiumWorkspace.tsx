"use client";

import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./SidebarLayout";
import { ContentCalendar } from "./ContentCalendar";
import { KanbanBoard } from "./KanbanBoard";

import { useRouter } from "next/navigation";

export function PremiumWorkspace() {
  const [activeTab, setActiveTab] = useState("calendar");
  const router = useRouter();

  const handleTabChange = (tab: string) => {
    if (tab === "profile") {
      router.push("/profile");
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <AppSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        
        <main className="flex-1 overflow-auto relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="p-8 h-full relative z-10">
            {activeTab === "calendar" && <ContentCalendar />}
            {activeTab === "board" && <KanbanBoard />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
