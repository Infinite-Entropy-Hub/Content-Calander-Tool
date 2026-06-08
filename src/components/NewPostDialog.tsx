"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, UploadCloud, Sparkles, Link as LinkIcon, CalendarIcon, Clock, CalendarClock, ArrowLeft, ArrowRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";

export const PLATFORMS = [
  { id: "instagram", name: "Instagram", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806539/Instagram_Logo_y6kb4h.png" },
  { id: "facebook", name: "Facebook", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780818031/facebook_c4ih7y.png" },
  { id: "youtube", name: "YouTube", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/YT_cvh8mb.png" },
  { id: "linkedin", name: "LinkedIn", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806668/Linkedin_Logo_b3kopr.webp" },
  { id: "x", name: "X (Twitter)", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/X_Logo_bw3isl.png" },
  { id: "threads", name: "Threads", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/Threads_Logo_vzkrpe.png" },
  { id: "reddit", name: "Reddit", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806539/Reddit_aeiwse.png" },
];

import { useEffect } from "react";

type MediaItem = { id: string; type: 'file'; file: File; url: string; name: string } | { id: string; type: 'url'; url: string; name: string };

export function NewPostDialog({ onPostAdded, editPost, triggerBtn, initialDate }: { onPostAdded?: () => void; editPost?: any; triggerBtn?: React.ReactNode; initialDate?: Date }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<string>("instagram");
  const [postFormat, setPostFormat] = useState<string>("reel");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [postTime, setPostTime] = useState(format(new Date(), "HH:mm"));
  const [isScheduled, setIsScheduled] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const [notes, setNotes] = useState("");
  
  const [inputType, setInputType] = useState<"upload" | "link">("upload");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [rawLink, setRawLink] = useState("");

  const [kanbanStatus, setKanbanStatus] = useState("idea");
  const [setReminder, setSetReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reminderTime, setReminderTime] = useState(format(new Date(), "HH:mm"));
  
  const [crossPostYT, setCrossPostYT] = useState(false);
  const [crossPostFB, setCrossPostFB] = useState(false);
  const [crossPostX, setCrossPostX] = useState(false);
  const [crossPostIG, setCrossPostIG] = useState(false);
  
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (open && editPost) {
      setTitle(editPost.title || "");
      setDescription(editPost.description || "");
      
      if (editPost.destinations && editPost.destinations.length > 0) {
        const main = editPost.destinations[0];
        setPlatform(main.platform);
        setPostFormat(main.post_format === 'reel' ? (main.platform === 'youtube' ? 'shorts' : 'reel') : main.post_format);
        
        setCrossPostYT(editPost.destinations.some((d: any) => d.platform === 'youtube' && d.platform !== main.platform));
        setCrossPostFB(editPost.destinations.some((d: any) => d.platform === 'facebook' && d.platform !== main.platform));
        setCrossPostX(editPost.destinations.some((d: any) => d.platform === 'x' && d.platform !== main.platform));
        setCrossPostIG(editPost.destinations.some((d: any) => d.platform === 'instagram' && d.platform !== main.platform));
      } else {
        setPlatform("instagram");
        setPostFormat("reel");
        setCrossPostYT(false);
        setCrossPostFB(false);
        setCrossPostX(false);
        setCrossPostIG(false);
      }
      
      if (editPost.notes) setNotes(editPost.notes);
      if (editPost.is_scheduled !== undefined) setIsScheduled(editPost.is_scheduled);
      
      if (editPost.scheduled_for) {
        setIsScheduled(editPost.is_scheduled);
        setScheduledDate(format(new Date(editPost.scheduled_for), "yyyy-MM-dd"));
        setPostTime(format(new Date(editPost.scheduled_for), "HH:mm"));
      }
      if (editPost.auto_publish !== undefined) {
        setAutoPublish(editPost.auto_publish);
      }
      setThumbnailUrl(editPost.thumbnail_url || "");
      
      if (editPost.media_urls && Array.isArray(editPost.media_urls)) {
        setMediaItems(editPost.media_urls.map((url: string, i: number) => ({
          id: `url-${i}-${Date.now()}`,
          type: 'url',
          url,
          name: url.split('/').pop() || `Image ${i + 1}`
        })));
      } else {
        setMediaItems([]);
      }
      
      setKanbanStatus(editPost.kanban_status || "idea");
      if (editPost.work_reminder_for) {
        setSetReminder(true);
        setReminderDate(format(new Date(editPost.work_reminder_for), "yyyy-MM-dd"));
        setReminderTime(format(new Date(editPost.work_reminder_for), "HH:mm"));
      } else {
        setSetReminder(false);
      }
    } else if (open && !editPost) {
      resetForm();
      setKanbanStatus("idea");
      setSetReminder(false);
      setReminderDate(format(new Date(), "yyyy-MM-dd"));
      setReminderTime(format(new Date(), "HH:mm"));
      if (initialDate) {
        setScheduledDate(format(initialDate, "yyyy-MM-dd"));
      }
    }
  }, [open, editPost, initialDate]);

  // Dynamic Formats based on platform
  const getFormatOptions = () => {
    if (platform === "youtube") return ["shorts", "full_video"];
    if (platform === "linkedin") return ["reel", "post", "carousel", "story"];
    if (platform === "instagram") return ["reel", "post", "carousel", "story"];
    return ["post", "thread", "reel", "story"]; // default fallbacks
  };

  const handlePlatformChange = (p: string) => {
    setPlatform(p);
    // Set default format
    if (p === "youtube") setPostFormat("shorts");
    else if (p === "linkedin") setPostFormat("reel");
    else if (p === "instagram") setPostFormat("reel");
    else setPostFormat("post");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: MediaItem[] = Array.from(e.target.files).map((f, i) => ({
        id: `file-${Date.now()}-${i}`,
        type: 'file',
        file: f,
        url: URL.createObjectURL(f),
        name: f.name
      }));
      setMediaItems(prev => [...prev, ...newItems]);
    }
  };

  const moveMediaLeft = (index: number) => {
    if (index === 0) return;
    setMediaItems(prev => {
      const newItems = [...prev];
      const temp = newItems[index - 1];
      newItems[index - 1] = newItems[index];
      newItems[index] = temp;
      return newItems;
    });
  };

  const moveMediaRight = (index: number) => {
    if (index === mediaItems.length - 1) return;
    setMediaItems(prev => {
      const newItems = [...prev];
      const temp = newItems[index + 1];
      newItems[index + 1] = newItems[index];
      newItems[index] = temp;
      return newItems;
    });
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (publishStatus: "scheduled" | "published" | "draft" = "scheduled") => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      setIsSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("You must be logged in.");
        setIsSubmitting(false);
        return;
      }

      // Validation: YouTube Shorts cannot be images
      if ((platform === "youtube" || crossPostYT) && mediaItems.length > 0) {
        const hasImage = mediaItems.some(item => {
          if (item.type === 'file') return item.file.type.startsWith('image/');
          return item.url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        });
        if (hasImage) {
          setErrorMsg("YouTube Shorts must be video files, not static images.");
          setIsSubmitting(false);
          return;
        }
      }

      let finalMediaUrls: string[] = [];

      if (inputType === "upload" && mediaItems.length > 0) {
        const uploadPromises = mediaItems.map(async (item) => {
          if (item.type === 'url') return item.url;
          
          const fileObj = item.file;
          const fileSize = fileObj.size;
          const MAX_SUPABASE_SIZE = 45 * 1024 * 1024; // 45MB

          if (fileSize > MAX_SUPABASE_SIZE) {
            // Get Presigned URL for Cloudflare R2
            const res = await fetch('/api/upload/presign-r2', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                filename: fileObj.name,
                contentType: fileObj.type || 'application/octet-stream'
              })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to get R2 upload URL');

            // Upload directly to R2 using PUT
            const uploadRes = await fetch(data.presignedUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': fileObj.type || 'application/octet-stream'
              },
              body: fileObj
            });

            if (!uploadRes.ok) {
              throw new Error(`Failed to upload to Cloudflare R2: ${uploadRes.statusText}`);
            }

            return data.publicUrl;
          } else {
            // Standard Supabase Upload
            const fileExt = fileObj.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(filePath, fileObj);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(filePath);
              
            return publicUrl;
          }
        });

        finalMediaUrls = await Promise.all(uploadPromises);
      } else if (rawLink) {
        finalMediaUrls = [rawLink];
      }

      // Main Post Insert
      const dateTimeString = `${scheduledDate}T${postTime}:00`;
      const scheduledFor = new Date(dateTimeString).toISOString();

      let destinations: any[] = [];
      const oldDestinations = editPost ? (editPost.destinations || []) : [];

      const getOldDest = (plat: string) => oldDestinations.find((d: any) => d.platform === plat);

      const addDest = (plat: string, format: string) => {
        const old = getOldDest(plat);
        // If we click "Update Details" (draft), keep the existing platform statuses.
        // If we click "Publish All" or "Schedule Post", override the platform status.
        const newStatus = (publishStatus === 'draft' && old) ? old.status : publishStatus;
        
        destinations.push({
          platform: plat,
          status: newStatus,
          post_format: format,
          external_id: old ? old.external_id : null,
          error_log: old ? old.error_log : null
        });
      };

      // Ensure no duplicates
      const addedPlatforms = new Set();
      const safeAdd = (p: string, f: string) => {
        if (!addedPlatforms.has(p)) {
          addDest(p, f);
          addedPlatforms.add(p);
        }
      };

      safeAdd(platform, postFormat);
      if (crossPostYT) safeAdd('youtube', 'shorts');
      if (crossPostFB) safeAdd('facebook', postFormat === 'story' ? 'story' : postFormat);
      if (crossPostX) safeAdd('x', 'post');
      if (crossPostIG) safeAdd('instagram', postFormat === 'shorts' ? 'reel' : postFormat);

      let kStatus = kanbanStatus;
      if (publishStatus === 'published') kStatus = 'published';

      let workReminderFor = null;
      if (setReminder && kStatus !== 'published' && kStatus !== 'scheduled') {
        workReminderFor = new Date(`${reminderDate}T${reminderTime}:00`).toISOString();
      }

      const postData = {
        title: title || "Untitled Concept",
        description,
        notes,
        kanban_status: kStatus,
        is_scheduled: isScheduled,
        auto_publish: autoPublish,
        destinations,
        media_urls: finalMediaUrls,
        thumbnail_url: thumbnailUrl || null,
        user_id: session.user.id,
        scheduled_for: scheduledFor,
        work_reminder_for: workReminderFor,
        work_reminder_sent: false,
      };

      let newPostId = "";
      if (editPost) {
        const { error: updateError } = await supabase.from('posts').update(postData).eq('id', editPost.id);
        if (updateError) throw updateError;
        newPostId = editPost.id;
      } else {
        const { data: newPost, error: dbError } = await supabase.from('posts').insert([postData]).select().single();
        if (dbError) throw dbError;
        newPostId = newPost.id;
      }

      // Helper for triggering publish APIs
      const triggerPublish = async (pId: string, plat: string) => {
        const endpoints: Record<string, string> = {
          instagram: "/api/publish/instagram",
          facebook: "/api/publish/facebook",
          youtube: "/api/publish/youtube",
          x: "/api/publish/twitter"
        };
        if (endpoints[plat]) {
          const res = await fetch(endpoints[plat], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: pId, userId: session.user.id })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Failed to publish to ${plat}`);
        }
      };

      // Handle Immediate Publishing
      if (publishStatus === "published") {
        toast.info(`Publishing to ${destinations.length} platform(s)... this might take a minute!`);
        await Promise.all(destinations.map(d => triggerPublish(newPostId, d.platform)));
      }

      toast.success(publishStatus === "published" ? "Published successfully!" : "Saved and scheduled successfully!");
      setTimeout(() => {
        setOpen(false);
        resetForm();
        if (onPostAdded) onPostAdded();
      }, 1500);
      
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(`Error: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaItems([]);
    setRawLink("");
    setRawLink("");
    setCrossPostFB(false);
    setCrossPostIG(false);
    setCrossPostX(false);
    setCrossPostYT(false);
    setKanbanStatus("idea");
    setSetReminder(false);
    setReminderDate(format(new Date(), "yyyy-MM-dd"));
    setReminderTime(format(new Date(), "HH:mm"));
    setErrorMsg("");
    setSuccessMsg("");
    setScheduledDate(format(new Date(), "yyyy-MM-dd"));
    setPostTime(format(new Date(), "HH:mm"));
    setIsScheduled(false);
    setAutoPublish(true);
    setNotes("");
  };

  return (
    <>
      {triggerBtn ? (
        <div onClick={() => setOpen(true)}>
          {triggerBtn}
        </div>
      ) : (
        <Button 
          onClick={() => setOpen(true)}
          className="bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 rounded-full px-6"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Post
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl border border-border/50 bg-background/95 backdrop-blur-3xl overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {editPost ? "Edit Content" : "Plan New Content"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Select your platform, format, and schedule it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 overflow-y-auto max-h-[75vh] px-1">
          
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* Platforms */}
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Destination Platform</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformChange(p.id)}
                    className={`h-10 px-3 rounded-lg flex items-center gap-2 border transition-all ${
                      platform === p.id 
                        ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                        : "bg-card border-border/50 hover:bg-muted opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={p.logo} alt={p.name} className="w-4 h-4 object-contain" />
                    <span className={`text-xs font-semibold ${platform === p.id ? "text-indigo-400" : "text-muted-foreground"}`}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Post Format</Label>
              <div className="flex flex-wrap gap-2">
                {getFormatOptions().map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setPostFormat(fmt)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-semibold border capitalize transition-all ${
                      postFormat === fmt 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {fmt.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="space-y-2 mt-2">
                {/* IG Cross-posts */}
                {platform === "instagram" && (
                  <>
                    {postFormat === "reel" && (
                      <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-red-500/10 border border-red-500/20">
                        <input type="checkbox" checked={crossPostYT} onChange={(e) => setCrossPostYT(e.target.checked)} className="rounded bg-background" />
                        <span className="text-[11px] font-medium text-red-300">Also upload to YouTube Shorts</span>
                      </label>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <input type="checkbox" checked={crossPostFB} onChange={(e) => setCrossPostFB(e.target.checked)} className="rounded bg-background" />
                      <span className="text-[11px] font-medium text-blue-300">Also cross-post to Facebook Page</span>
                    </label>
                    {postFormat === "post" && (
                      <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-zinc-500/10 border border-zinc-500/20">
                        <input type="checkbox" checked={crossPostX} onChange={(e) => setCrossPostX(e.target.checked)} className="rounded bg-background" />
                        <span className="text-[11px] font-medium text-zinc-300">Also post on X (Twitter)</span>
                      </label>
                    )}
                  </>
                )}

                {/* YT Cross-posts */}
                {platform === "youtube" && postFormat === "shorts" && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-pink-500/10 border border-pink-500/20">
                      <input type="checkbox" checked={crossPostIG} onChange={(e) => setCrossPostIG(e.target.checked)} className="rounded bg-background" />
                      <span className="text-[11px] font-medium text-pink-300">Also upload to Instagram Reels</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <input type="checkbox" checked={crossPostFB} onChange={(e) => setCrossPostFB(e.target.checked)} className="rounded bg-background" />
                      <span className="text-[11px] font-medium text-blue-300">Also upload to Facebook Reels</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-zinc-500/10 border border-zinc-500/20">
                      <input type="checkbox" checked={crossPostX} onChange={(e) => setCrossPostX(e.target.checked)} className="rounded bg-background" />
                      <span className="text-[11px] font-medium text-zinc-300">Also post on X (Twitter)</span>
                    </label>
                  </>
                )}

                {/* X Cross-posts */}
                {platform === "x" && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-pink-500/10 border border-pink-500/20">
                      <input type="checkbox" checked={crossPostIG} onChange={(e) => setCrossPostIG(e.target.checked)} className="rounded bg-background" />
                      <span className="text-[11px] font-medium text-pink-300">Also post on Instagram</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <input type="checkbox" checked={crossPostFB} onChange={(e) => setCrossPostFB(e.target.checked)} className="rounded bg-background" />
                      <span className="text-[11px] font-medium text-blue-300">Also post on Facebook</span>
                    </label>
                  </>
                )}
              </div>
            </div>
            
            {/* Date & Time */}
            <div className="space-y-3 bg-card/40 p-4 rounded-xl border border-border/50 shadow-inner">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" /> Date & Time
                </Label>
                <label className="flex items-center gap-2 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/20 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isScheduled} 
                    onChange={(e) => setIsScheduled(e.target.checked)} 
                    className="rounded bg-background accent-indigo-500 w-3.5 h-3.5" 
                  />
                  <span className="text-[10px] font-semibold text-indigo-400">Schedule this post</span>
                </label>
              </div>
              
              <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-300 ${isScheduled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <Input 
                    type="date" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-background/80 pl-9 border-border/50 h-10 text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 rounded-lg shadow-sm w-full"
                  />
                </div>
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <Input 
                    type="time" 
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    className="bg-background/80 pl-9 border-border/50 h-10 text-xs font-medium focus:ring-2 focus:ring-indigo-500/30 rounded-lg shadow-sm w-full"
                  />
                </div>
              </div>
              
              {isScheduled && (
                <div className="pt-2 flex flex-col sm:flex-row gap-2 mt-2 border-t border-border/30">
                  <label className={`flex-1 flex flex-col gap-1 cursor-pointer p-2.5 rounded-lg border transition-all ${autoPublish ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-background/50 border-border/50 hover:bg-card'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="publishMode"
                        checked={autoPublish}
                        onChange={() => setAutoPublish(true)}
                        className="accent-indigo-500"
                      />
                      <span className="text-xs font-bold text-foreground">Automated Publish</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-5">Automatically post to platform APIs.</span>
                  </label>
                  <label className={`flex-1 flex flex-col gap-1 cursor-pointer p-2.5 rounded-lg border transition-all ${!autoPublish ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-background/50 border-border/50 hover:bg-card'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="publishMode"
                        checked={!autoPublish}
                        onChange={() => setAutoPublish(false)}
                        className="accent-indigo-500"
                      />
                      <span className="text-xs font-bold text-foreground">Manual Notification</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-5">Send me an Email & Telegram to post natively.</span>
                  </label>
                </div>
              )}

              {kanbanStatus !== 'scheduled' && kanbanStatus !== 'published' && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Work Reminder
                    </Label>
                    <label className="flex items-center gap-2 cursor-pointer bg-pink-500/10 hover:bg-pink-500/20 px-2 py-1 rounded-md border border-pink-500/20 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={setReminder} 
                        onChange={(e) => setSetReminder(e.target.checked)} 
                        className="rounded bg-background accent-pink-500 w-3.5 h-3.5" 
                      />
                      <span className="text-[10px] font-semibold text-pink-400">Set Telegram Reminder</span>
                    </label>
                  </div>

                  <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-300 ${setReminder ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                    <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-focus-within:text-pink-400 transition-colors">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <Input 
                        type="date" 
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="bg-background/80 pl-9 border-border/50 h-10 text-xs font-medium focus:ring-2 focus:ring-pink-500/30 rounded-lg shadow-sm w-full"
                      />
                    </div>
                    <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground group-focus-within:text-pink-400 transition-colors">
                        <Clock className="w-4 h-4" />
                      </div>
                      <Input 
                        type="time" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="bg-background/80 pl-9 border-border/50 h-10 text-xs font-medium focus:ring-2 focus:ring-pink-500/30 rounded-lg shadow-sm w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Internal Notes (Instructions)</Label>
              <Textarea 
                className="bg-background/50 border-border/50 min-h-[60px] text-xs resize-none"
                placeholder="E.g. Remember to tag @sponsor, add link in bio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* Media Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Creative Asset</Label>
                <div className="flex bg-muted/50 rounded-md p-1 border border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setInputType("upload")}
                    className={`h-6 px-2 text-[10px] ${inputType === "upload" ? "bg-background shadow-sm" : ""}`}
                  >
                    <UploadCloud className="w-3 h-3 mr-1" /> Upload
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setInputType("link")}
                    className={`h-6 px-2 text-[10px] ${inputType === "link" ? "bg-background shadow-sm" : ""}`}
                  >
                    <LinkIcon className="w-3 h-3 mr-1" /> Link
                  </Button>
                </div>
              </div>

              {inputType === "upload" ? (
                <div className="space-y-3">
                  <div className="border border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center justify-center bg-card/30 hover:bg-card/60 transition-colors relative cursor-pointer overflow-hidden group min-h-[100px]">
                    <input 
                      type="file" 
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      onChange={handleFileChange}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="text-center z-20 flex flex-col items-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Drag & drop your masterpiece, or click to browse</p>
                    </div>
                  </div>

                  {mediaItems.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                      {mediaItems.map((item, idx) => (
                        <div key={item.id} className="relative flex-none w-24 h-24 rounded-md border border-border/50 bg-background overflow-hidden group snap-start">
                          {item.url.match(/\.(mp4|mov|webm)$/i) || (item.type === 'file' && item.file.type.startsWith('video/')) ? (
                            <video src={item.url} className="w-full h-full object-cover opacity-80" />
                          ) : (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <button onClick={() => removeMedia(idx)} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full hover:bg-red-500 transition-colors">
                              <X className="w-3 h-3 text-white" />
                            </button>
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.preventDefault(); moveMediaLeft(idx); }} disabled={idx === 0} className="bg-background/80 p-1 rounded hover:bg-background disabled:opacity-30">
                                <ArrowLeft className="w-3 h-3 text-foreground" />
                              </button>
                              <button onClick={(e) => { e.preventDefault(); moveMediaRight(idx); }} disabled={idx === mediaItems.length - 1} className="bg-background/80 p-1 rounded hover:bg-background disabled:opacity-30">
                                <ArrowRight className="w-3 h-3 text-foreground" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white p-0.5 truncate text-center">
                            {idx + 1}. {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Input 
                  placeholder="https://your-raw-video-link.mp4" 
                  className="bg-background/50 h-9 text-xs"
                  value={rawLink}
                  onChange={(e) => setRawLink(e.target.value)}
                />
              )}
            </div>

            {/* Text Fields */}
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Title / Internal Name</Label>
              <Input 
                className="bg-background/50 border-border/50 h-9 text-xs"
                placeholder="e.g. 5 Tips for Creators"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Caption & Description</Label>
              <Textarea 
                className="bg-background/50 border-border/50 min-h-[80px] text-xs resize-none"
                placeholder="Write an engaging caption..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            {['shorts', 'reel', 'full_video', 'story'].includes(postFormat) && (
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Thumbnail Image URL (Optional)</Label>
                <Input 
                  className="bg-background/50 border-border/50 h-9 text-xs"
                  placeholder="https://your-thumbnail-link.jpg"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-3 border-t border-border/50">
          {errorMsg && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-md">{errorMsg}</div>}
          {successMsg && <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-md">{successMsg}</div>}
          
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting} className="hover:bg-muted/50 h-8 text-xs">Cancel</Button>
              {editPost ? (
                <Button onClick={() => handleSave(isScheduled ? "scheduled" : (editPost.status === 'scheduled' ? 'draft' : editPost.status))} disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all">
                  {isSubmitting ? "Updating..." : "Update Details"}
                </Button>
              ) : (
                <Button onClick={() => handleSave(isScheduled ? "scheduled" : "draft")} disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all">
                  {isSubmitting ? "Saving..." : (isScheduled ? "Schedule Post" : "Save as Draft")}
                </Button>
              )}
              {!editPost && !isScheduled && (
                <Button onClick={() => handleSave("published")} disabled={isSubmitting || platform !== 'instagram'} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 text-sm font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all">
                  Publish Now
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
