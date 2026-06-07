"use client";

import { PieChart, TrendingUp, Users, Activity } from "lucide-react";

export function AnalyticsView() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Performance insights coming soon.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Total Reach", icon: Users, value: "—", desc: "Across all platforms" },
          { title: "Engagement Rate", icon: Activity, value: "—", desc: "Average engagement" },
          { title: "Top Format", icon: TrendingUp, value: "—", desc: "Best performing type" },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 rounded-2xl border border-border/50 bg-card/20 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold">Analytics Engine under construction</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          We are currently building integrations with native platform APIs to bring you real-time metrics for your posts.
        </p>
      </div>
    </div>
  );
}
