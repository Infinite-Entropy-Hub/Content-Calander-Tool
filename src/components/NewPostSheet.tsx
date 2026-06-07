"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Camera, PlayCircle, Plus, UploadCloud, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NewPostSheet({ onPostAdded }: { onPostAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"instagram" | "youtube">("instagram");
  const [isAuto, setIsAuto] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // In local mode, we won't actually upload to Supabase, just save the metadata to Prisma.
      // But we can store the file name or a mock URL for the UI to look good.
      const media_url = file ? URL.createObjectURL(file) : null;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Concept",
          description,
          platform,
          publish_mode: isAuto ? "auto" : "manual",
          status: isAuto ? "scheduled" : "draft",
          scheduled_for: isAuto ? new Date(Date.now() + 86400000).toISOString() : null,
          media_url
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save post to Prisma");
      }

      setOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      if (onPostAdded) onPostAdded();
      
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving post to local database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger 
        render={
          <Button className="bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 rounded-full px-6">
            <Plus className="h-4 w-4 mr-2" /> Create Post
          </Button>
        } 
      />
      <SheetContent className="sm:max-w-[600px] border-l border-border/50 bg-background/80 backdrop-blur-3xl overflow-y-auto">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Plan New Content
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-base">
            Upload media and configure your cross-platform strategy.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-8 py-4">
          {/* Platform Selector */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination Platform</Label>
            <div className="flex justify-center space-x-4">
              <Button
                variant={platform === "instagram" ? "default" : "outline"}
                className={`flex-1 h-12 border-border/50 ${platform === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0 shadow-lg shadow-pink-500/20" : "bg-card"}`}
                onClick={() => setPlatform("instagram")}
              >
                <Camera className="mr-2 h-4 w-4" /> Instagram Reel
              </Button>
              <Button
                variant={platform === "youtube" ? "default" : "outline"}
                className={`flex-1 h-12 border-border/50 ${platform === "youtube" ? "bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/20" : "bg-card"}`}
                onClick={() => setPlatform("youtube")}
              >
                <PlayCircle className="mr-2 h-4 w-4" /> YouTube Short
              </Button>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creative Asset</Label>
            <div className="border border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center bg-card/30 hover:bg-card/60 transition-colors relative cursor-pointer overflow-hidden group">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange}
                accept="video/mp4,video/quicktime,image/jpeg,image/png"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
              </div>
              
              {file ? (
                <div className="text-center z-20">
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-green-400 mt-1">Ready for upload</p>
                </div>
              ) : (
                <div className="text-center z-20">
                  <p className="text-sm font-medium text-foreground">Drag & drop your masterpiece</p>
                  <p className="text-xs text-muted-foreground mt-2">MP4, MOV, JPG up to 100MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-6 bg-card/30 rounded-xl p-5 border border-border/50">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-muted-foreground">{platform === "youtube" ? "Video Title" : "Internal Campaign Name"}</Label>
              <Input 
                id="title" 
                className="bg-background/50 border-border/50 h-11"
                placeholder="e.g. My Awesome Reel" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-muted-foreground">
                {platform === "youtube" ? "Description & SEO Tags" : "Caption & Hashtags"}
              </Label>
              <Textarea 
                id="description" 
                className="bg-background/50 border-border/50 min-h-[120px] resize-none"
                placeholder="Write an engaging caption..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Auto/Manual Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 p-5 bg-indigo-500/5">
            <div className="space-y-1">
              <Label className="text-base font-bold text-indigo-400">Autopilot Mode</Label>
              <p className="text-xs text-muted-foreground pr-4">
                Let the system publish this automatically via official APIs.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {!isAuto && <Badge variant="outline" className="text-muted-foreground border-border/50">Manual Drop</Badge>}
              <Switch checked={isAuto} onCheckedChange={setIsAuto} className="data-[state=checked]:bg-indigo-500" />
            </div>
          </div>

        </div>
        
        <div className="pt-6 pb-2 border-t border-border/50 flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="hover:bg-muted/50">Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="bg-white text-black hover:bg-white/90 px-8">
            {isSubmitting ? "Processing..." : "Add to Queue"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
