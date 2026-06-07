"use client";

import { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  addDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Download, Copy, Trash2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewPostDialog, PLATFORMS } from "./NewPostDialog";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const copyCaption = () => {
    if (!selectedPost?.description) return;
    navigator.clipboard.writeText(selectedPost.description);
    alert("Caption copied to clipboard!");
  };

  const downloadMedia = () => {
    if (!selectedPost?.media_url) return;
    window.open(selectedPost.media_url, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const deleteMedia = confirm("Do you also want to permanently delete the attached media file from storage?");
      
      if (deleteMedia && selectedPost?.media_url && selectedPost.media_url.includes('supabase.co')) {
        const parts = selectedPost.media_url.split('/media/');
        if (parts.length === 2) {
          const filePath = parts[1];
          await supabase.storage.from('media').remove([filePath]);
        }
      }

      await supabase.from('posts').delete().eq('id', selectedPost.id);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkDone = async () => {
    const deleteMedia = confirm("Do you want to permanently delete the raw media file from storage to save space?");
    
    try {
      let newMediaUrl = selectedPost.media_url;
      
      if (deleteMedia && selectedPost.media_url && selectedPost.media_url.includes('supabase.co')) {
        // Extract file path from URL (naive approach for this example)
        const parts = selectedPost.media_url.split('/media/');
        if (parts.length === 2) {
          const filePath = parts[1];
          await supabase.storage.from('media').remove([filePath]);
          newMediaUrl = null;
        }
      }

      await supabase.from('posts').update({ status: 'posted', media_url: newMediaUrl }).eq('id', selectedPost.id);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePublishNow = async () => {
    if (!selectedPost) return;
    try {
      setIsPublishing(true);
      setErrorMsg("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const endpoint = selectedPost.platform === "facebook" ? "/api/publish/facebook" : "/api/publish/instagram";

      const publishRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selectedPost.id, userId: session.user.id })
      });
      
      const publishData = await publishRes.json();
      if (!publishRes.ok) {
         throw new Error(publishData.error || `Failed to publish to ${selectedPost.platform}`);
      }
      
      fetchPosts();
      setSelectedPost({...selectedPost, status: 'published'});
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/60">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-muted/50 rounded-full p-1 border border-border/50 shadow-inner">
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-background/80 p-0" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-background/80 p-0" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <NewPostDialog onPostAdded={fetchPosts} />
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-[10px] text-muted-foreground py-2 uppercase tracking-widest border-r border-border/30 last:border-0">
          {format(addDays(startDate, i), "EEEE")}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-border/50 bg-card/20">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const currentDay = day;
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        const dayPosts = posts.filter(p => p.scheduled_for && isSameDay(new Date(p.scheduled_for), currentDay));

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] p-2 border-r border-b border-border/30 transition-all duration-300 hover:bg-card/40 group relative overflow-hidden ${
              !isCurrentMonth ? "bg-background/20 opacity-50" : "bg-card/10"
            }`}
          >
            {isToday && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            )}
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                isToday ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="space-y-1 mt-1">
              {dayPosts.map((post) => {
                const platformAsset = PLATFORMS.find(p => p.id === post.platform);
                return (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className={`flex flex-col gap-1 p-1.5 rounded-md border border-border/50 text-[10px] transition-all cursor-pointer ${
                      (post.status === 'posted' || post.status === 'published') ? 'bg-green-500/10 border-green-500/20 opacity-70' : 'bg-background/60 hover:border-indigo-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {platformAsset ? (
                        <img src={platformAsset.logo} alt={post.platform} className="w-3.5 h-3.5 object-contain" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-sm bg-muted/50" />
                      )}
                      <span className="truncate font-semibold text-foreground/90">{post.title}</span>
                    </div>
                    {post.description && (
                      <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight px-0.5">{post.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-0.5 px-0.5">
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground/70">{post.post_format || "post"}</span>
                      {(post.status === 'posted' || post.status === 'published') && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-border/30 rounded-bl-3xl rounded-br-3xl overflow-hidden">{rows}</div>;
  };

  const selectedPlatform = selectedPost ? PLATFORMS.find(p => p.id === selectedPost.platform) : null;

  return (
    <>
      <div className="bg-card/40 backdrop-blur-3xl rounded-3xl border border-border/50 shadow-2xl overflow-hidden h-full flex flex-col text-sm">
        {renderHeader()}
        <div className="flex-1 overflow-auto">
          {renderDays()}
          {renderCells()}
        </div>
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-3xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedPlatform && <img src={selectedPlatform.logo} className="w-6 h-6 object-contain" />}
                <span className="truncate max-w-[250px]">{selectedPost?.title}</span>
              </div>
              <span className="text-xs font-normal uppercase tracking-widest px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {selectedPost?.status} • {selectedPost?.post_format}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {selectedPost?.media_url ? (
              <div className="w-full max-h-[50vh] bg-black/50 rounded-xl overflow-hidden flex items-center justify-center relative border border-border/50">
                {selectedPost.media_url.match(/\.(mp4|mov|webm)$/i) ? (
                  <video src={selectedPost.media_url} controls className="max-w-full max-h-[50vh] object-contain" />
                ) : (
                  <img src={selectedPost.media_url} alt={selectedPost.title} className="max-w-full max-h-[50vh] object-contain" />
                )}
              </div>
            ) : (
              <div className="w-full h-24 bg-muted/30 rounded-xl flex items-center justify-center border border-border/50 border-dashed text-muted-foreground text-xs">
                No Media Attached
              </div>
            )}
            
            <div className="space-y-2 bg-card/50 p-3 rounded-xl border border-border/50 max-h-[150px] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{selectedPost?.description || "No description provided."}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
              {errorMsg && <div className="w-full mb-1 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-md">{errorMsg}</div>}
              
              <Button onClick={copyCaption} variant="secondary" size="sm" className="flex-1 text-[11px] h-8 min-w-[70px]">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
              </Button>
              {selectedPost?.media_url && (
                <Button onClick={downloadMedia} variant="secondary" size="sm" className="flex-1 text-[11px] h-8 min-w-[70px]">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Save
                </Button>
              )}
              {selectedPost?.status !== 'published' && selectedPost?.status !== 'posted' && (selectedPost?.platform === 'instagram' || selectedPost?.platform === 'facebook') && (
                <Button onClick={handlePublishNow} disabled={isPublishing} size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] h-8 min-w-[85px]">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> {isPublishing ? "Wait..." : "Publish"}
                </Button>
              )}
              {selectedPost?.status !== 'published' && selectedPost?.status !== 'posted' && (
                <Button onClick={handleMarkDone} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[11px] h-8 min-w-[75px]">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Done
                </Button>
              )}
              <Button onClick={handleDelete} variant="destructive" size="sm" className="flex-1 text-[11px] h-8 min-w-[75px]">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
