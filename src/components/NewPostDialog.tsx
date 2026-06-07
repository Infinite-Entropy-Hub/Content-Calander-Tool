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
  
  const [inputType, setInputType] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawLink, setRawLink] = useState("");
  
  const [crossPostYT, setCrossPostYT] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in.");
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
      const postData = {
        title: title || "Untitled Concept",
        description,
        platform,
        post_format: postFormat,
        status: "draft",
        media_url: finalMediaUrl,
        user_id: session.user.id,
        scheduled_for: new Date(scheduledDate).toISOString(),
      };

      const { error: dbError } = await supabase.from('posts').insert([postData]);
      if (dbError) throw dbError;

      // Handle Cross-Posting to YT Shorts
      if (crossPostYT && platform !== "youtube" && postFormat === "reel") {
        const ytData = { ...postData, platform: "youtube", post_format: "shorts" };
        const { error: ytError } = await supabase.from('posts').insert([ytData]);
        if (ytError) console.error("Cross-post error:", ytError);
      }

      setOpen(false);
      resetForm();
      if (onPostAdded) onPostAdded();
      
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Error saving post: ${error.message || error}`);
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
    setScheduledDate(format(new Date(), "yyyy-MM-dd"));
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
        <DialogContent className="sm:max-w-[800px] border border-border/50 bg-background/95 backdrop-blur-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Plan New Content
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Select your platform, format, and schedule it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          
          {/* Platforms */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination Platform</Label>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePlatformChange(p.id)}
                  className={`h-14 px-4 rounded-xl flex items-center gap-2 border transition-all ${
                    platform === p.id 
                      ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-105" 
                      : "bg-card border-border/50 hover:bg-muted opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={p.logo} alt={p.name} className="w-6 h-6 object-contain" />
                  <span className={`text-sm font-semibold ${platform === p.id ? "text-indigo-400" : "text-muted-foreground"}`}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formats & Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Format</Label>
              <div className="flex flex-wrap gap-2">
                {getFormatOptions().map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setPostFormat(fmt)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border capitalize transition-all ${
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
                <label className="flex items-center gap-2 mt-2 cursor-pointer p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <input type="checkbox" checked={crossPostYT} onChange={(e) => setCrossPostYT(e.target.checked)} className="rounded border-indigo-500 text-indigo-500 focus:ring-indigo-500 bg-background" />
                  <span className="text-xs font-medium text-indigo-300">Also upload to YouTube Shorts</span>
                </label>
              )}
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input 
                  type="date" 
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-background/50 pl-10 border-border/50 h-10"
                />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creative Asset</Label>
              <div className="flex bg-muted/50 rounded-lg p-1 border border-border/50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setInputType("upload")}
                  className={`h-7 px-3 text-xs ${inputType === "upload" ? "bg-background shadow-sm" : ""}`}
                >
                  <UploadCloud className="w-3 h-3 mr-1.5" /> Upload
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setInputType("link")}
                  className={`h-7 px-3 text-xs ${inputType === "link" ? "bg-background shadow-sm" : ""}`}
                >
                  <LinkIcon className="w-3 h-3 mr-1.5" /> Paste Link
                </Button>
              </div>
            </div>

            {inputType === "upload" ? (
              <div className="border border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center justify-center bg-card/30 hover:bg-card/60 transition-colors relative cursor-pointer overflow-hidden group">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={handleFileChange}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" />
                </div>
                
                {file ? (
                  <div className="text-center z-20">
                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-green-400 mt-1">Ready for Supabase Storage</p>
                  </div>
                ) : (
                  <div className="text-center z-20">
                    <p className="text-sm font-medium text-foreground">Drag & drop your masterpiece</p>
                  </div>
                )}
              </div>
            ) : (
              <Input 
                placeholder="https://your-raw-video-link.mp4" 
                className="bg-background/50 h-10"
                value={rawLink}
                onChange={(e) => setRawLink(e.target.value)}
              />
            )}
          </div>

          {/* Text Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title / Internal Name</Label>
              <Input 
                className="bg-background/50 border-border/50 h-10"
                placeholder="e.g. 5 Tips for Creators"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption & Description</Label>
              <Textarea 
                className="bg-background/50 border-border/50 min-h-[80px] resize-none"
                placeholder="Write an engaging caption..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

        </div>
        
        <div className="pt-4 border-t border-border/50 flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="hover:bg-muted/50">Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="bg-white text-black hover:bg-white/90 px-8">
            {isSubmitting ? "Uploading..." : "Save Content"}
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
