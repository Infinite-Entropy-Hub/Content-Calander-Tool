"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Loader2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

import { supabase } from "@/lib/supabase";
import { PLATFORMS } from "./NewPostDialog";

export function KanbanBoard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const columns = [
    { id: "draft", title: "Ideas & Drafts", bg: "bg-muted/30 border-muted/50 text-muted-foreground" },
    { id: "in_progress", title: "In Production", bg: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
    { id: "ready", title: "Ready for Drop", bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" },
    { id: "posted", title: "Live & Posted", bg: "bg-green-500/10 border-green-500/20 text-green-400" },
  ];

  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-3xl rounded-3xl border border-border/50 shadow-2xl overflow-hidden p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Content Pipeline</h2>
        <p className="text-sm text-muted-foreground mt-1">Track your content through all stages of production</p>
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col) => {
          const columnPosts = posts.filter((p) => p.status === col.id);
          
          return (
            <div key={col.id} className="w-[320px] shrink-0 flex flex-col h-full">
              <div className={`px-4 py-3 rounded-t-2xl border-t border-x font-semibold flex items-center justify-between ${col.bg}`}>
                {col.title}
                <span className="bg-background/50 px-2 py-0.5 rounded-full text-xs">{columnPosts.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-card/20 backdrop-blur-md border-x border-b border-border/50 rounded-b-2xl p-3 space-y-3 custom-scrollbar">
                {isLoading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading items...</div>
                ) : columnPosts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/30">
                    Drop content here
                  </div>
                ) : (
                  columnPosts.map((post) => {
                    const platformAsset = PLATFORMS.find(p => p.id === post.platform);
                    return (
                      <div 
                        key={post.id}
                        className="bg-card/60 backdrop-blur-3xl border border-border/50 p-4 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          {platformAsset ? (
                            <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0 border border-border/50 shadow-inner group-hover:scale-110 transition-transform">
                              <img src={platformAsset.logo} alt={post.platform} className="w-5 h-5 object-contain" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-muted/50 shrink-0" />
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                            <GripHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <h4 className="font-semibold text-foreground mb-1 group-hover:text-indigo-400 transition-colors">{post.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {post.description || "No description provided."}
                        </p>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div className="flex items-center text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-md border border-border/50">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {post.scheduled_for ? format(new Date(post.scheduled_for), "MMM d") : "No date"}
                          </div>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">{post.post_format || "post"}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
