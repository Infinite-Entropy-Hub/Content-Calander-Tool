"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Star, StickyNote, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NoteEditorDialog, Note } from "./NoteEditorDialog";

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      await supabase.auth.signOut();
    }
    if (!session || sessionError) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("is_starred", { ascending: false })
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setNotes(data as Note[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      await fetchNotes();
    };

    void loadNotes();
  }, [fetchNotes]);

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (noteData.id) {
      // Update existing
      await supabase
        .from("notes")
        .update({
          title: noteData.title,
          content: noteData.content,
          is_starred: noteData.is_starred,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteData.id);
    } else {
      // Create new
      await supabase
        .from("notes")
        .insert([{
          title: noteData.title || "",
          content: noteData.content || "",
          is_starred: noteData.is_starred || false,
          user_id: session.user.id,
        }]);
    }
    fetchNotes();
  };

  const handleDeleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    fetchNotes();
  };

  const toggleStar = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    await supabase
      .from("notes")
      .update({ is_starred: !note.is_starred })
      .eq("id", note.id);
    fetchNotes();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <StickyNote className="w-8 h-8 text-indigo-500" />
            Notes
          </h2>
          <p className="text-muted-foreground mt-1">Jot down your ideas, scripts, and important links.</p>
        </div>
        <button
          onClick={handleCreateNote}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      <div className="flex-1 overflow-auto pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <StickyNote className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
            <p className="text-muted-foreground max-w-md">
              Create your first note to keep track of ideas, hashtags, or any useful info for your content.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleEditNote(note)}
                className="break-inside-avoid bg-card border border-border/50 rounded-2xl p-5 hover:shadow-xl hover:border-indigo-500/30 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="font-semibold text-lg line-clamp-2 pr-8">{note.title}</h3>
                  <button
                    onClick={(e) => toggleStar(e, note)}
                    className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-yellow-500"
                  >
                    <Star className={`w-5 h-5 ${note.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </button>
                </div>
                
                {note.content && (
                  <p className="text-muted-foreground text-sm line-clamp-6 whitespace-pre-wrap relative z-10">
                    {note.content}
                  </p>
                )}
                
                {(!note.title && !note.content) && (
                  <p className="text-muted-foreground/50 italic text-sm">Empty note</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditorOpen && (
        <NoteEditorDialog
          key={selectedNote?.id ?? "new-note"}
          isOpen={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          note={selectedNote}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}
    </div>
  );
}
