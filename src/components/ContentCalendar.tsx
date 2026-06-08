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
import { ChevronLeft, ChevronRight, Download, Copy, Trash2, CheckCircle2, Send, ExternalLink, Edit3, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewPostDialog, PLATFORMS } from "./NewPostDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Custom Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMediaChecked, setDeleteMediaChecked] = useState(true);
  const [deletePostChecked, setDeletePostChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Auto-scroll to today on mobile
    const todayId = `day-${format(new Date(), "yyyy-MM-dd")}`;
    const el = document.getElementById(todayId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentDate]);

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

  const copyCaption = async () => {
    if (!selectedPost?.description) return;
    try {
      await navigator.clipboard.writeText(selectedPost.description);
      toast.success("Caption copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy caption");
    }
  };

  const downloadAllMedia = () => {
    if (!selectedPost?.media_urls || selectedPost.media_urls.length === 0) {
      toast.error("No media files to download");
      return;
    }
    selectedPost.media_urls.forEach((url: string, index: number) => {
      setTimeout(() => {
        window.open(url, "_blank");
      }, index * 500);
    });
    toast.success("Downloading media...");
  };

  const executeDelete = async () => {
    if (!selectedPost) return;
    setIsDeleting(true);
    try {
      if (deleteMediaChecked && selectedPost.media_urls && selectedPost.media_urls.length > 0) {
        const filePaths = selectedPost.media_urls
          .filter((url: string) => url.includes('supabase.co'))
          .map((url: string) => {
            const parts = url.split('/media/');
            return parts.length === 2 ? parts[1] : null;
          })
          .filter(Boolean);
        
        if (filePaths.length > 0) {
          await supabase.storage.from('media').remove(filePaths);
        }
      }

      if (deletePostChecked) {
        await supabase.from('posts').delete().eq('id', selectedPost.id);
        setSelectedPost(null);
        toast.success("Post deleted successfully");
      } else if (deleteMediaChecked && !deletePostChecked) {
        await supabase.from('posts').update({ media_urls: [] }).eq('id', selectedPost.id);
        setSelectedPost({ ...selectedPost, media_urls: [] });
        toast.success("Media cleared successfully");
      }

      fetchPosts();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
    setIsDeleting(false);
  };

  const handleMarkDone = async () => {
    try {
      await supabase.from('posts').update({ kanban_status: 'published' }).eq('id', selectedPost.id);
      setSelectedPost({...selectedPost, kanban_status: 'published'});
      fetchPosts();
      toast.success("Post marked as completed!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const updateKanbanStatus = async (newStatus: string) => {
    try {
      await supabase.from('posts').update({ kanban_status: newStatus }).eq('id', selectedPost.id);
      setSelectedPost({...selectedPost, kanban_status: newStatus});
      fetchPosts();
      toast.success("Status updated!");
    } catch(e) {
      toast.error("Failed to update status");
    }
  };

  const handlePublishNow = async () => {
    if (!selectedPost) return;
    try {
      setIsPublishing(true);
      setErrorMsg("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const endpoints: Record<string, string> = {
          instagram: "/api/publish/instagram",
          facebook: "/api/publish/facebook",
          youtube: "/api/publish/youtube",
          x: "/api/publish/twitter"
      };

      const destinations = selectedPost.destinations || [];
      const promises = destinations.map(async (dest: any) => {
          const endpoint = endpoints[dest.platform];
          if (!endpoint) return;
          const publishRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: selectedPost.id, userId: session.user.id })
          });
          const publishData = await publishRes.json();
          if (!publishRes.ok) {
            throw new Error(`[${dest.platform}] ${publishData.error || 'Failed to publish'}`);
          }
      });

      await Promise.all(promises);
      
      await supabase.from('posts').update({ kanban_status: 'published' }).eq('id', selectedPost.id);
      fetchPosts();
      setSelectedPost({...selectedPost, kanban_status: 'published'});
      toast.success(`Successfully published to all platforms!`);
    } catch (e: any) {
      setErrorMsg(e.message);
      toast.error(e.message);
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

        const renderedPosts = dayPosts;

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
            <div className="flex justify-between items-start mb-1 relative">
              <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                isToday ? 'bg-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                {formattedDate}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0">
                <NewPostDialog 
                  initialDate={currentDay}
                  onPostAdded={fetchPosts}
                  triggerBtn={
                    <Button variant="ghost" size="icon" className="h-5 w-5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full">
                      <span className="text-sm font-light leading-none mb-[1px]">+</span>
                    </Button>
                  }
                />
              </div>
            </div>
            
            <div className="space-y-1 mt-1">
              {renderedPosts.map((post) => {
                return (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className={`flex flex-col gap-1 p-1.5 rounded-md border border-border/50 text-[10px] transition-all cursor-pointer ${
                      (post.kanban_status === 'published') ? 'bg-green-500/10 border-green-500/20 opacity-70' : 'bg-background/60 hover:border-indigo-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(post.destinations || []).map((dest: any) => {
                        const platformAsset = PLATFORMS.find(p => p.id === dest.platform);
                        return platformAsset ? (
                          <img key={dest.platform} src={platformAsset.logo} alt={dest.platform} className="w-3.5 h-3.5 object-contain" />
                        ) : null;
                      })}
                      <span className="truncate font-semibold text-foreground/90 flex-1">{post.title}</span>
                    </div>
                    {post.description && (
                      <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight px-0.5">{post.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-0.5 px-0.5">
                      <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                        post.kanban_status === 'idea' ? 'bg-yellow-500/20 text-yellow-500' :
                        post.kanban_status === 'implementation' ? 'bg-blue-500/20 text-blue-500' :
                        post.kanban_status === 'test' ? 'bg-purple-500/20 text-purple-500' :
                        post.kanban_status === 'ready_to_publish' ? 'bg-orange-500/20 text-orange-500' :
                        post.kanban_status === 'scheduled' ? 'bg-indigo-500/20 text-indigo-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {post.kanban_status?.replace(/_/g, ' ') || 'idea'}
                      </span>
                      {post.kanban_status === 'published' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
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

  const renderMobileList = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    let dayCursor = monthStart;
    const daysArray = [];
    while (dayCursor <= monthEnd) {
      daysArray.push(dayCursor);
      dayCursor = addDays(dayCursor, 1);
    }
    
    // get all posts for the month, sort by date
    const monthPosts = posts.filter(p => p.scheduled_for && isSameMonth(new Date(p.scheduled_for), monthStart)).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());
    
    // Group posts by date, then by title/description
    const groupedPosts: Record<string, any[]> = {};
    monthPosts.forEach(post => {
      const dateStr = format(new Date(post.scheduled_for), "yyyy-MM-dd");
      if (!groupedPosts[dateStr]) groupedPosts[dateStr] = [];
      
      const existingGroup = groupedPosts[dateStr].find(p => p.title === post.title && p.description === post.description);
      if (existingGroup) {
        existingGroup.grouped_platforms.push(post.platform);
      } else {
        groupedPosts[dateStr].push({ ...post, grouped_platforms: [post.platform] });
      }
    });

    return (
      <div className="md:hidden flex flex-col p-4 space-y-6">
        {daysArray.map(dateObj => {
          const dateStr = format(dateObj, "yyyy-MM-dd");
          const isToday = isSameDay(dateObj, new Date());
          const dayPosts = groupedPosts[dateStr] || [];
          
          return (
            <div key={dateStr} id={`day-${dateStr}`} className={`flex flex-col gap-3 scroll-mt-20 ${isToday ? 'bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-muted/50 text-foreground border border-border/50'}`}>
                    {format(dateObj, "d")}
                  </div>
                  <span className={`text-sm font-semibold uppercase tracking-widest ${isToday ? 'text-indigo-400' : 'text-muted-foreground'}`}>{format(dateObj, "EEEE")}</span>
                </div>
                <NewPostDialog 
                  initialDate={dateObj}
                  onPostAdded={fetchPosts}
                  triggerBtn={
                    <Button variant="ghost" size="icon" className="h-6 w-6 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full">
                      <Plus className="w-3 h-3" />
                    </Button>
                  }
                />
              </div>
              
              <div className="space-y-3 pl-11">
                {dayPosts.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground/30 py-1 font-medium tracking-wider uppercase">No posts scheduled</div>
                ) : (
                  dayPosts.map(post => {
                    return (
                      <div 
                        key={post.id} 
                        onClick={() => setSelectedPost(post)}
                        className={`flex flex-col gap-2 p-3.5 rounded-xl border border-border/50 transition-all cursor-pointer shadow-sm ${
                          (post.status === 'posted' || post.status === 'published') ? 'bg-green-500/10 border-green-500/20' : 'bg-card/60 hover:border-indigo-500/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {post.grouped_platforms.map((platId: string) => {
                            const platformAsset = PLATFORMS.find(p => p.id === platId);
                            return platformAsset ? (
                              <img key={platId} src={platformAsset.logo} alt={platId} className="w-5 h-5 object-contain" />
                            ) : null;
                          })}
                          <span className="font-bold text-sm truncate text-foreground/90 flex-1">{post.title}</span>
                          {(post.status === 'posted' || post.status === 'published') && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </div>
                        {post.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{post.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-border/30">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">{post.post_format || "post"}</span>
                          <span className="text-[10px] text-muted-foreground/80 font-bold bg-background/50 px-2 py-0.5 rounded-md">{format(new Date(post.scheduled_for), "h:mm a")}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedPlatform = selectedPost ? PLATFORMS.find(p => p.id === selectedPost.platform) : null;

  const getViewLink = (platform: string, id: string) => {
    if (!id) return null;
    if (id.startsWith('http')) return id;
    if (platform === "youtube") return `https://youtube.com/watch?v=${id}`;
    if (platform === "x") return `https://x.com/i/web/status/${id}`;
    if (platform === "instagram") return `https://instagram.com/p/${id}`;
    if (platform === "facebook") {
      const parts = id.split('_');
      return parts.length > 1 ? `https://facebook.com/${parts[0]}/posts/${parts[1]}` : `https://facebook.com/${id}`;
    }
    return null;
  };

  return (
    <>
      <div className="bg-card/40 backdrop-blur-3xl rounded-3xl border border-border/50 shadow-2xl overflow-hidden h-full flex flex-col text-sm">
        {renderHeader()}
        <div className="flex-1 overflow-auto">
          <div className="hidden md:block">
            {renderDays()}
            {renderCells()}
          </div>
          {renderMobileList()}
        </div>
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-3xl border-border/50 overflow-hidden p-0">
          <div className="p-6 pb-2 border-b border-border/50">
            <DialogTitle className="text-2xl font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedPlatform && <img src={selectedPlatform.logo} className="w-6 h-6 object-contain" />}
                <span className="truncate max-w-[350px] uppercase">{selectedPost?.title}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedPost?.is_scheduled && selectedPost?.scheduled_for && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {format(new Date(selectedPost.scheduled_for), "MMM d, yyyy • h:mm a")}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50">
                  {selectedPost?.status} • {selectedPost?.post_format}
                </span>
              </div>
            </DialogTitle>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 p-6 overflow-y-auto max-h-[75vh]">
            {/* LEFT COLUMN: Media Preview */}
            <div className="space-y-4 h-full flex flex-col">
              {selectedPost?.media_urls && selectedPost.media_urls.length > 0 ? (
                <div className="w-full flex-1 min-h-[300px] bg-black/40 rounded-xl overflow-hidden flex items-center justify-center relative border border-border/50 p-2">
                  <div className="flex flex-col gap-3 w-full h-full overflow-y-auto pr-1">
                    {selectedPost.media_urls.map((url: string, index: number) => (
                      <div key={index} className="w-full relative rounded-lg overflow-hidden flex items-center justify-center border border-border/30 shrink-0 bg-black/50 aspect-[4/5] max-h-[600px]">
                        {url.match(/\.(mp4|mov|webm)$/i) ? (
                          <video src={url} controls className="w-full h-full object-contain" onError={(e) => {
                            const target = e.target as HTMLVideoElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = '<div class="text-xs text-muted-foreground">Media no longer available</div>';
                            }
                          }} />
                        ) : (
                          <img src={url} alt={`Media ${index}`} className="w-full h-full object-contain" onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x500/1e1e1e/888888?text=Media+Unavailable";
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-[300px] bg-muted/30 rounded-xl flex items-center justify-center border border-border/50 border-dashed text-muted-foreground text-xs">
                  No Media Attached
                </div>
              )}
            </div>
            
            {/* RIGHT COLUMN: Info & Controls */}
            <div className="space-y-4 flex flex-col h-full">
              <div className="space-y-2 bg-card/50 p-3.5 rounded-xl border border-border/50 max-h-[200px] overflow-y-auto shrink-0 shadow-inner">
                <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{selectedPost?.description || "No caption provided."}</p>
              </div>

              {selectedPost?.notes && (
                <div className="space-y-1 bg-yellow-500/10 p-3.5 rounded-xl border border-yellow-500/20 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/80">Internal Notes</span>
                  <p className="text-xs text-yellow-200/90 whitespace-pre-wrap leading-relaxed mt-1">{selectedPost.notes}</p>
                </div>
              )}

              {selectedPost?.work_reminder_for && (
                <div className="space-y-1 bg-pink-500/10 p-3.5 rounded-xl border border-pink-500/20 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500/80">Telegram Work Reminder</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-xs text-pink-200/90 font-medium">
                      {format(new Date(selectedPost.work_reminder_for), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              )}

              {selectedPost?.error_log && (
                <div className={`space-y-1 p-3.5 rounded-xl border shrink-0 ${selectedPost.status === 'failed' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedPost.status === 'failed' ? 'text-red-400' : 'text-green-400'}`}>
                    Execution Log
                  </span>
                  <p className={`text-xs whitespace-pre-wrap leading-relaxed mt-1 ${selectedPost.status === 'failed' ? 'text-red-300' : 'text-green-300'}`}>{selectedPost.error_log}</p>
                </div>
              )}

              <div className="flex-1" />

              <div className="bg-muted/30 border border-border/50 rounded-xl p-3 shrink-0 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Destinations</span>
                <div className="space-y-2">
                  {(selectedPost?.destinations || []).map((dest: any, idx: number) => {
                    const asset = PLATFORMS.find(p => p.id === dest.platform);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-background/50 rounded-lg p-2 border border-border/30">
                        <div className="flex items-center gap-2">
                          {asset && <img src={asset.logo} alt={dest.platform} className="w-4 h-4 object-contain" />}
                          <span className="text-xs font-semibold capitalize">{dest.platform}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            dest.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                            dest.status === 'published' ? 'bg-green-500/20 text-green-500' :
                            dest.status === 'scheduled' ? 'bg-indigo-500/20 text-indigo-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {dest.status || 'draft'}
                          </span>
                          {dest.external_id && dest.status === 'published' && (
                            <Button 
                              onClick={() => window.open(getViewLink(dest.platform, dest.external_id) as string, '_blank')}
                              variant="link" 
                              className="h-auto p-0 text-[10px] text-indigo-400"
                            >
                              View Live
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50 shrink-0">
                {errorMsg && <div className="w-full px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-md font-medium">{errorMsg}</div>}
                
                <div className="bg-background/50 border border-border/50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Kanban Status</span>
                  <select 
                    value={selectedPost?.kanban_status || 'idea'}
                    onChange={(e) => updateKanbanStatus(e.target.value)}
                    className="bg-muted text-xs font-bold px-2 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="idea">Idea</option>
                    <option value="implementation">Implementation</option>
                    <option value="test">Test</option>
                    <option value="ready_to_publish">Ready to Publish</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={copyCaption} variant="secondary" size="sm" className="w-full text-xs h-9">
                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy Caption
                  </Button>
                  {selectedPost?.media_urls && selectedPost.media_urls.length > 0 && (
                    <Button onClick={downloadAllMedia} variant="secondary" size="sm" className="w-full text-xs h-9">
                      <Download className="w-3.5 h-3.5 mr-2" /> Save Media
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost?.kanban_status !== 'published' && (
                    <Button onClick={handlePublishNow} disabled={isPublishing} size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9">
                      <Send className="w-3.5 h-3.5 mr-2" /> {isPublishing ? "Wait..." : "Publish All"}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleMarkDone} 
                    disabled={selectedPost?.kanban_status === 'published'}
                    size="sm" 
                    className={`w-full text-xs h-9 ${
                      selectedPost?.kanban_status === 'published'
                        ? "bg-green-500/20 text-green-400 cursor-not-allowed opacity-70" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> 
                    {selectedPost?.kanban_status === 'published' ? "Completed" : "Mark Done"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <NewPostDialog 
                    editPost={selectedPost} 
                    onPostAdded={() => {
                      setSelectedPost(null);
                      fetchPosts();
                    }} 
                    triggerBtn={
                      <Button variant="outline" size="sm" className="w-full text-xs h-9 bg-background/50">
                        <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Details
                      </Button>
                    }
                  />

                  <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" size="sm" className="w-full text-xs h-9 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </Button>
                </div>
              </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-3xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" /> Delete Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-foreground/80">
              How would you like to delete this item?
            </p>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={deleteMediaChecked}
                  onChange={(e) => setDeleteMediaChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 bg-background accent-red-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold group-hover:text-red-400 transition-colors">Delete Media Only</span>
                <span className="text-xs text-muted-foreground">Keep the post record for history, but permanently delete the media files from your storage bucket to save space.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={deletePostChecked}
                  onChange={(e) => setDeletePostChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 bg-background accent-red-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold group-hover:text-red-400 transition-colors">Delete Entire Post Record</span>
                <span className="text-xs text-muted-foreground">Erase this post entirely from your content calendar.</span>
              </div>
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={executeDelete} 
              disabled={isDeleting || (!deleteMediaChecked && !deletePostChecked)}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
