"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileImage, FileVideo, FolderOpen, Loader2 } from "lucide-react";

type MediaFile = {
  name: string;
  id: string;
  updated_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
  url: string;
};

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.storage
        .from("media")
        .list(session.user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (data) {
        const fileList = data
          .filter(f => f.name !== ".emptyFolderPlaceholder")
          .map(f => {
            const { data: publicUrlData } = supabase.storage
              .from("media")
              .getPublicUrl(`${session.user.id}/${f.name}`);
              
            return {
              ...f,
              url: publicUrlData.publicUrl
            };
          }) as MediaFile[];
        setFiles(fileList);
      }
      setLoading(false);
    };

    fetchMedia();
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
          <p className="text-sm text-muted-foreground">Manage all your uploaded assets</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => {
            const isVideo = file.metadata?.mimetype?.includes("video") || file.name.endsWith(".mp4") || file.name.endsWith(".mov");
            return (
              <div key={file.id} className="group relative rounded-xl border border-border/50 bg-card/40 overflow-hidden hover:border-indigo-500/50 transition-colors">
                <div className="aspect-square bg-muted relative">
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
