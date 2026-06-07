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
import { Plus, UploadCloud, Sparkles, Link as LinkIcon, CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import Image from "next/image";

export const PLATFORMS = [
  { id: "instagram", name: "Instagram", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806539/Instagram_Logo_y6kb4h.png" },
  { id: "facebook", name: "Facebook", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780818031/facebook_c4ih7y.png" },
  { id: "youtube", name: "YouTube", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/YT_cvh8mb.png" },
  { id: "linkedin", name: "LinkedIn", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806668/Linkedin_Logo_b3kopr.webp" },
  { id: "x", name: "X (Twitter)", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/X_Logo_bw3isl.png" },
  { id: "threads", name: "Threads", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806538/Threads_Logo_vzkrpe.png" },
  { id: "reddit", name: "Reddit", logo: "https://res.cloudinary.com/drwys1ksu/image/upload/v1780806539/Reddit_aeiwse.png" },
];

export function NewPostDialog({ onPostAdded }: { onPostAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<string>("instagram");
  const [postFormat, setPostFormat] = useState<string>("reel");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [postTime, setPostTime] = useState(format(new Date(), "HH:mm"));
  
  const [inputType, setInputType] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawLink, setRawLink] = useState("");
  
  const [crossPostYT, setCrossPostYT] = useState(false);
  const [crossPostFB, setCrossPostFB] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async (publishStatus: "scheduled" | "published" = "scheduled") => {
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

      let finalMediaUrl = rawLink;

      if (inputType === "upload" && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        finalMediaUrl = publicUrl;
      }

      // Main Post Insert
      const dateTimeString = `${scheduledDate}T${postTime}:00`;
      const scheduledFor = new Date(dateTimeString).toISOString();

      const postData = {
        title: title || "Untitled Concept",
        description,
        platform,
        post_format: postFormat,
        status: publishStatus,
        media_url: finalMediaUrl,
        user_id: session.user.id,
        scheduled_for: scheduledFor,
      };

      const { data: newPost, error: dbError } = await supabase.from('posts').insert([postData]).select().single();
      if (dbError) throw dbError;

      // Handle immediate publishing
      if (publishStatus === "published" && platform === "instagram") {
        const publishRes = await fetch("/api/publish/instagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: newPost.id, userId: session.user.id })
        });
        
        const publishData = await publishRes.json();
        if (!publishRes.ok) {
           throw new Error(publishData.error || "Failed to publish to Instagram");
        }
      }

      // Handle Cross-Posting to YT Shorts
      if (crossPostYT && platform !== "youtube" && postFormat === "reel") {
        const ytData = { ...postData, platform: "youtube", post_format: "shorts" };
        const { error: ytError } = await supabase.from('posts').insert([ytData]);
        if (ytError) console.error("Cross-post error:", ytError);
      }

      // Handle Cross-Posting to Facebook
      if (crossPostFB && platform === "instagram") {
        const fbData = { ...postData, platform: "facebook" };
        const { error: fbError } = await supabase.from('posts').insert([fbData]);
        if (fbError) console.error("Cross-post FB error:", fbError);
      }

      setSuccessMsg(publishStatus === "published" ? "Published successfully!" : "Saved and scheduled successfully!");
      setTimeout(() => {
        setOpen(false);
        resetForm();
        if (onPostAdded) onPostAdded();
      }, 1500);
      
    } catch (error: any) {
      console.error("Save failed:", error);
      setErrorMsg(`Error: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setRawLink("");
    setCrossPostYT(false);
    setCrossPostFB(false);
    setErrorMsg("");
    setSuccessMsg("");
    setScheduledDate(format(new Date(), "yyyy-MM-dd"));
    setPostTime(format(new Date(), "HH:mm"));
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 rounded-full px-6"
      >
        <Plus className="h-4 w-4 mr-2" /> Create Post
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl border border-border/50 bg-background/95 backdrop-blur-3xl overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Plan New Content
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
              
              {postFormat === "reel" && platform !== "youtube" && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                  <input type="checkbox" checked={crossPostYT} onChange={(e) => setCrossPostYT(e.target.checked)} className="rounded border-indigo-500 text-indigo-500 focus:ring-indigo-500 bg-background" />
                  <span className="text-[11px] font-medium text-indigo-300">Also upload to YouTube Shorts</span>
                </label>
              )}

              {platform === "instagram" && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <input type="checkbox" checked={crossPostFB} onChange={(e) => setCrossPostFB(e.target.checked)} className="rounded border-blue-500 text-blue-500 focus:ring-blue-500 bg-background" />
                  <span className="text-[11px] font-medium text-blue-300">Also cross-post to Facebook Page</span>
                </label>
              )}
            </div>
            
            {/* Date & Time */}
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Date & Time</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input 
                    type="date" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-background/50 pl-9 border-border/50 h-9 text-xs"
                  />
                </div>
                <div className="relative flex-1">
                  <Input 
                    type="time" 
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    className="bg-background/50 border-border/50 h-9 text-xs"
                  />
                </div>
              </div>
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
                <div className="border border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center justify-center bg-card/30 hover:bg-card/60 transition-colors relative cursor-pointer overflow-hidden group min-h-[100px]">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onChange={handleFileChange}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {file ? (
                    <div className="text-center z-20 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                        <UploadCloud className="h-4 w-4 text-green-400" />
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">{file.name}</p>
                      <p className="text-[10px] text-green-400 mt-1">Ready for Storage</p>
                    </div>
                  ) : (
                    <div className="text-center z-20 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Drag & drop your masterpiece</p>
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
          </div>
        </div>
        
        <div className="pt-3 border-t border-border/50">
          {errorMsg && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-md">{errorMsg}</div>}
          {successMsg && <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-md">{successMsg}</div>}
          
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isSubmitting} className="hover:bg-muted/50 h-8 text-xs">Cancel</Button>
            <Button onClick={() => handleSave("scheduled")} size="sm" disabled={isSubmitting} className="bg-indigo-500 text-white hover:bg-indigo-600 px-4 h-8 text-xs font-medium">
              {isSubmitting ? "Saving..." : "Schedule Post"}
            </Button>
            <Button onClick={() => handleSave("published")} size="sm" disabled={isSubmitting} className="bg-white text-black hover:bg-white/90 px-6 h-8 text-xs font-medium shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {isSubmitting ? "Uploading..." : "Publish Right Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
