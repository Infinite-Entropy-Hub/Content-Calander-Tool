"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileVideo, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type MediaFile = {
  name: string;
  id: string;
  updated_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
  url: string;
  source: 'supabase' | 'cloudflare';
  r2Key?: string;
};

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const res = await fetch('/api/media/list', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await res.json();
        if (res.ok && data.media) {
          setFiles(data.media);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchMedia();
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
            <p className="text-sm text-muted-foreground">Manage all your uploaded assets</p>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              <input 
                type="checkbox" 
                className="rounded border-border/50 bg-background/50 accent-indigo-500 w-4 h-4"
                checked={selectedFiles.length === files.length && files.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFiles(files.map(f => f.name));
                  } else {
                    setSelectedFiles([]);
                  }
                }}
              />
              Select All
            </label>
            
            {selectedFiles.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return;
                  setIsDeleting(true);
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    const filesToDelete = files.filter(f => selectedFiles.includes(f.name));
                    try {
                      const res = await fetch('/api/media/delete', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ files: filesToDelete })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setFiles(files.filter(f => !selectedFiles.includes(f.name)));
                        setSelectedFiles([]);
                      } else {
                        alert("Error deleting files: " + data.error);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  setIsDeleting(false);
                }}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : `Delete (${selectedFiles.length})`}
              </Button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => {
            const isVideo = file.metadata?.mimetype?.includes("video") || file.name.endsWith(".mp4") || file.name.endsWith(".mov") || file.name.endsWith(".webm");
            return (
              <div key={file.id} className={`group relative rounded-xl border transition-colors overflow-hidden ${selectedFiles.includes(file.name) ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-border/50 bg-card/40 hover:border-indigo-500/50'}`}>
                <div className="absolute top-2 left-2 z-20">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-border/50 bg-background/80 accent-indigo-500 cursor-pointer shadow-sm"
                    checked={selectedFiles.includes(file.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles([...selectedFiles, file.name]);
                      } else {
                        setSelectedFiles(selectedFiles.filter(name => name !== file.name));
                      }
                    }}
                  />
                </div>
                <div className="absolute top-2 right-2 z-20">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    file.source === 'cloudflare' 
                      ? 'bg-[#F38020]/20 text-[#F38020] border border-[#F38020]/50'
                      : 'bg-[#3ECF8E]/20 text-[#3ECF8E] border border-[#3ECF8E]/50'
                  }`}>
                    {file.source === 'cloudflare' ? 'Cloudflare R2' : 'Supabase'}
                  </span>
                </div>
                <div 
                  className="aspect-square bg-muted relative cursor-pointer"
                  onClick={() => {
                    if (selectedFiles.includes(file.name)) {
                      setSelectedFiles(selectedFiles.filter(name => name !== file.name));
                    } else {
                      setSelectedFiles([...selectedFiles, file.name]);
                    }
                  }}
                >
                  {isVideo ? (
                    <video src={file.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <p className="text-xs text-white px-2 text-center break-all font-semibold">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-zinc-300">
                      {file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                    </p>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-2">
                  {isVideo ? <FileVideo className="w-4 h-4 text-purple-400 shrink-0" /> : <FileImage className="w-4 h-4 text-indigo-400 shrink-0" />}
                  <p className="text-xs font-medium truncate">{file.name}</p>
                </div>
              </div>
            )
          })}
          
          {files.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl bg-card/20">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="font-semibold">Library is empty</p>
              <p className="text-sm text-muted-foreground">Upload media when creating posts.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

