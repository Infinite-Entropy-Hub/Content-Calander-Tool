"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import {
  Star,
  Trash,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  X,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type Note = {
  id: string;
  title: string;
  content: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
};

interface NoteEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave: (note: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NoteEditorDialog({ isOpen, onOpenChange, note, onSave, onDelete }: NoteEditorDialogProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isStarred, setIsStarred] = useState(note?.is_starred || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ title, content, is_starred: isStarred, ...(note?.id ? { id: note.id } : {}) });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note?.id) return;
    setIsDeleting(true);
    try {
      await onDelete(note.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const focusTextarea = (selectionStart?: number, selectionEnd?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    setTimeout(() => {
      textarea.focus();
      if (selectionStart !== undefined && selectionEnd !== undefined) {
        textarea.setSelectionRange(selectionStart, selectionEnd);
      }
    }, 0);
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setContent(newText);
    focusTextarea(start + prefix.length, end + prefix.length);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const nextBreak = text.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const selectedBlock = text.slice(lineStart, lineEnd);
    const lines = selectedBlock.length ? selectedBlock.split("\n") : [""];
    const nextLines = lines.map((line, index) => {
      const linePrefix = prefix === "1. " ? `${index + 1}. ` : prefix;
      return line.trimStart().startsWith(linePrefix) ? line : `${linePrefix}${line}`;
    });
    const nextBlock = nextLines.join("\n");

    setContent(`${text.slice(0, lineStart)}${nextBlock}${text.slice(lineEnd)}`);
    focusTextarea(lineStart + prefix.length, lineStart + nextBlock.length);
  };

  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    const needsLeadingBreak = start > 0 && text[start - 1] !== "\n";
    const insertion = `${needsLeadingBreak ? "\n" : ""}${template}`;

    setContent(`${text.slice(0, start)}${insertion}${text.slice(start)}`);
    focusTextarea(start + insertion.length, start + insertion.length);
  };

  const handleCloseDialog = async (open: boolean) => {
    if (!open) {
      const hasTitleChanged = title !== (note?.title || "");
      const hasContentChanged = content !== (note?.content || "");
      const hasStarChanged = isStarred !== (note?.is_starred || false);

      const hasMeaningfulContent = title.trim() || content.trim();

      if ((hasTitleChanged || hasContentChanged || hasStarChanged) && hasMeaningfulContent) {
        // Fire and forget save so the dialog closes instantly for a snappy feel
        onSave({ title, content, is_starred: isStarred, ...(note?.id ? { id: note.id } : {}) }).catch(console.error);
      }
      onOpenChange(false);
    } else {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent showCloseButton={false} className="sm:max-w-[94vw] md:max-w-5xl h-[90vh] p-0 border border-white/10 shadow-2xl bg-[#0a0a0c] overflow-hidden flex flex-col rounded-xl">
        
        <DialogHeader className="px-4 sm:px-6 py-3 flex flex-row items-center justify-between border-b border-white/5 bg-white/5 space-y-0">
          <DialogTitle className="sr-only">Edit Note</DialogTitle>
          <div className="flex items-center gap-3">
            {note?.updated_at && (
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 bg-slate-900/70 px-2.5 py-1.5 rounded-md border border-white/5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Edited {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsStarred(!isStarred)}
              title={isStarred ? "Unstar note" : "Star note"}
              className={`rounded-md transition-all ${isStarred ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20" : "text-slate-400 hover:text-white hover:bg-white/10"}`}
            >
              <Star className={`h-5 w-5 ${isStarred ? "fill-current" : ""}`} />
            </Button>
            
            {note && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete note"
                className="rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
              >
                <Trash className="h-5 w-5" />
              </Button>
            )}
            
            <div className="w-px h-6 bg-white/10 mx-1" />
            
            <Button variant="ghost" size="icon" onClick={() => handleCloseDialog(false)} title="Close note" className="rounded-md text-slate-400 hover:text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-8 lg:px-12 py-4 sm:py-6 gap-4 bg-[#0a0a0c]">
          <input
            placeholder="Untitled Note"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-h-12 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xl sm:text-2xl font-bold leading-snug text-white placeholder:text-slate-600 outline-none transition-colors focus:border-indigo-400/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/15"
          />
          
          <div className="flex flex-wrap items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-lg">
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("**", "**")} title="Bold" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("*", "*")} title="Italic" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <Italic className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => insertLinePrefix("- ")} title="Bullet list" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <List className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertLinePrefix("1. ")} title="Numbered list" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <ListOrdered className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertLinePrefix("- [ ] ")} title="Checklist" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <CheckSquare className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertLinePrefix("> ")} title="Quote" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <Quote className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("[", "](url)")} title="Link" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("`", "`")} title="Inline code" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md">
              <Code className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertTemplate("Goals\n- [ ] \n\nIdeas\n- \n\nNext steps\n1. ")}
              className="h-8 px-3 text-xs font-semibold text-indigo-200 hover:text-white hover:bg-indigo-500/20 rounded-md"
            >
              Planner
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            placeholder="Plan ideas, hooks, scripts, links, tasks, and checklist items..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-0 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 text-base leading-7 text-slate-200 placeholder:text-slate-600 outline-none transition-colors custom-scrollbar focus:border-indigo-400/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t border-white/5 bg-slate-950/60 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (!title.trim() && !content.trim())} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 rounded-md px-5 py-2.5 min-h-10 text-sm font-semibold transition-all"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
