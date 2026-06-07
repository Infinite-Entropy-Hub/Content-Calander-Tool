"use client";

import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./SidebarLayout";
import { ContentCalendar } from "./ContentCalendar";
import { KanbanBoard } from "./KanbanBoard";
import { MediaLibrary } from "./MediaLibrary";
import { AnalyticsView } from "./AnalyticsView";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

function DashboardView() {
  const [view, setView] = useState<"calendar" | "board">("calendar");

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex items-center bg-card border border-border/50 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setView("calendar")}
            className={`h-8 px-3 rounded-md transition-all ${view === "calendar" ? "bg-indigo-500/10 text-indigo-400 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Calendar className="w-4 h-4 mr-2" /> Calendar
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setView("board")}
            className={`h-8 px-3 rounded-md transition-all ${view === "board" ? "bg-indigo-500/10 text-indigo-400 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" /> Board
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        {view === "calendar" && <ContentCalendar />}
        {view === "board" && <KanbanBoard />}
      </div>
    </div>
  );
}

export function PremiumWorkspace() {
  const [activeTab, setActiveTab] = useState("dashboard");
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
        
        <main className="flex-1 overflow-auto relative flex flex-col">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="p-4 md:p-8 flex-1 relative z-10">
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "library" && <MediaLibrary />}
            {activeTab === "analytics" && <AnalyticsView />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
