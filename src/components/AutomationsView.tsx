"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Camera, ExternalLink, MessageCircle, Plus, RefreshCw, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Media = {
  id: string; caption?: string; permalink?: string; thumbnail_url?: string;
  media_url?: string; media_type?: string; media_product_type?: string; timestamp?: string;
};

type Automation = {
  id: string; name: string; platform: string; media_id: string; media_title?: string;
  media_permalink?: string; media_thumbnail_url?: string; keywords: string[];
  public_reply: string; private_reply: string; confirmation_word: string;
  final_message: string; final_link_url: string; final_button_text: string;
  is_enabled: boolean; scan_existing_comments: boolean; last_scanned_at?: string;
};

const PRESETS = [
  {
    name: "Friendly source delivery",
    publicReply: "Hey {{username}}! I have sent the details to your DM 🚀",
    privateReply: "Thanks for your interest! Follow the page, then reply FOLLOWED here and I will send the complete source files.",
    finalMessage: "You are all set 🎉 Tap below to open the complete project source and guide.",
    button: "Get the source",
  },
  {
    name: "Robotics guide",
    publicReply: "Nice one, {{username}}! Check your messages for the {{keyword}} guide 🤖",
    privateReply: "Want the full build guide and code? Follow the page and reply FOLLOWED to this message.",
    finalMessage: "Here is the complete robotics guide, code, and parts list. Happy building!",
    button: "Open full guide",
  },
  {
    name: "Short and direct",
    publicReply: "Sent it in DM, {{username}} ✅",
    privateReply: "Follow the page and reply FOLLOWED to receive the link.",
    finalMessage: "As promised, here is your resource:",
    button: "View resource",
  },
];

const blankForm = {
  name: "", mediaId: "", keywords: "", matchType: "contains",
  publicReply: PRESETS[0].publicReply, privateReply: PRESETS[0].privateReply,
  confirmationWord: "FOLLOWED", finalMessage: PRESETS[0].finalMessage,
  finalLinkUrl: "", finalButtonText: PRESETS[0].button, scanExisting: true,
};

export function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  const selectedMedia = useMemo(() => media.find((item) => item.id === form.mediaId), [media, form.mediaId]);

  const loadAutomations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("comment_automations").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message.includes("comment_automations") ? "Run Supabase query 18 before using Automations." : error.message);
    setAutomations(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.from("comment_automations").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error(error.message.includes("comment_automations") ? "Run Supabase query 18 before using Automations." : error.message);
      setAutomations(data || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const loadMedia = async () => {
    setLoadingMedia(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const response = await fetch("/api/meta/media", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load Instagram posts");
      setMedia(data.media || []);
      setAccountId(data.account.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load posts");
    } finally {
      setLoadingMedia(false);
    }
  };

  const startCreate = async () => {
    setForm(blankForm);
    setOpen(true);
    if (!media.length) await loadMedia();
  };

  const save = async () => {
    if (!form.name.trim() || !selectedMedia || !form.keywords.trim() || !form.finalLinkUrl.trim()) {
      toast.error("Add a name, post, keyword, and final link.");
      return;
    }
    try { new URL(form.finalLinkUrl); } catch { toast.error("Enter a valid final link including https://"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in again."); setSaving(false); return; }
    const keywords = form.keywords.split(",").map((item) => item.trim()).filter(Boolean);
    const { error } = await supabase.from("comment_automations").insert({
      user_id: user.id, name: form.name.trim(), platform: "instagram", platform_account_id: accountId,
      media_id: selectedMedia.id, media_title: selectedMedia.caption?.slice(0, 180) || "Instagram post",
      media_permalink: selectedMedia.permalink, media_thumbnail_url: selectedMedia.thumbnail_url || selectedMedia.media_url,
      keywords, match_type: form.matchType, public_reply: form.publicReply.trim(), private_reply: form.privateReply.trim(),
      confirmation_word: form.confirmationWord.trim() || "FOLLOWED", final_message: form.finalMessage.trim(),
      final_link_url: form.finalLinkUrl.trim(), final_button_text: form.finalButtonText.trim() || "Get the source",
      scan_existing_comments: form.scanExisting, is_enabled: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Automation created");
    setOpen(false);
    await loadAutomations();
  };

  const toggle = async (automation: Automation, enabled: boolean) => {
    setAutomations((items) => items.map((item) => item.id === automation.id ? { ...item, is_enabled: enabled } : item));
    const { error } = await supabase.from("comment_automations").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", automation.id);
    if (error) { toast.error(error.message); await loadAutomations(); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this automation and its delivery history?")) return;
    const { error } = await supabase.from("comment_automations").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Automation deleted"); await loadAutomations(); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-400"><Zap className="size-4" /> AUTOMATION STUDIO</div>
          <h1 className="text-3xl font-bold tracking-tight">Turn comments into conversations</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Match a keyword on one Instagram post, reply publicly, then deliver your resource through a permission-friendly DM flow.</p>
        </div>
        <Button onClick={startCreate} className="bg-indigo-600 text-white hover:bg-indigo-700"><Plus className="mr-2 size-4" /> New automation</Button>
      </div>

      <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/5">
        <CardContent className="flex gap-4 p-5">
          <div className="rounded-xl bg-indigo-500/15 p-3"><Bot className="size-5 text-indigo-400" /></div>
          <div><p className="font-semibold">Current automation type</p><p className="mt-1 text-sm text-muted-foreground">Keyword comment → public reply → private prompt → visitor replies → clickable source button. Follow status is not available through Meta, so the visitor confirms by replying.</p></div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><RefreshCw className="mr-2 size-4 animate-spin" /> Loading automations</div>
      ) : automations.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><MessageCircle className="mb-4 size-10 text-indigo-400" /><h2 className="text-lg font-semibold">No automations yet</h2><p className="mb-5 mt-2 text-sm text-muted-foreground">Create your first keyword campaign for a post or Reel.</p><Button onClick={startCreate}><Plus className="mr-2 size-4" /> Create automation</Button></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {automations.map((automation) => (
            <Card key={automation.id} className="overflow-hidden border-border/60 bg-card/60">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="flex min-w-0 gap-3">
                  <div className="size-12 overflow-hidden rounded-xl bg-muted">{automation.media_thumbnail_url ? (
                    // Meta CDN URLs are dynamic and are not suitable for a fixed next/image remote pattern.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={automation.media_thumbnail_url} alt="" className="size-full object-cover" />
                  ) : <Camera className="m-3 size-6" />}</div>
                  <div className="min-w-0"><CardTitle className="truncate text-base">{automation.name}</CardTitle><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{automation.media_title}</p></div>
                </div>
                <Switch checked={automation.is_enabled} onCheckedChange={(checked) => toggle(automation, checked)} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">{automation.keywords.map((keyword) => <Badge key={keyword} variant="secondary">Comment: {keyword}</Badge>)}<Badge variant={automation.is_enabled ? "default" : "outline"}>{automation.is_enabled ? "Live" : "Paused"}</Badge></div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery</p><p className="mt-1 line-clamp-2">{automation.final_message}</p><p className="mt-2 truncate text-xs text-indigo-400">{automation.final_link_url}</p></div>
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="text-xs text-muted-foreground">{automation.scan_existing_comments ? `Backfill on${automation.last_scanned_at ? ` · last ${new Date(automation.last_scanned_at).toLocaleString()}` : ""}` : "New comments only"}</div>
                  <div className="flex gap-1">{automation.media_permalink && <a href={automation.media_permalink} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" /></a>}<Button variant="ghost" size="icon" onClick={() => remove(automation.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="size-4" /></Button></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Create keyword comment automation</DialogTitle><DialogDescription>Instagram only for this first automation type. Facebook support can use the same studio later.</DialogDescription></DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2"><Label>Automation name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Robotic ARM source delivery" /></div>
            <div className="grid gap-2"><div className="flex items-center justify-between"><Label>Instagram post or Reel</Label><Button variant="ghost" size="sm" onClick={loadMedia} disabled={loadingMedia}><RefreshCw className={`mr-2 size-3.5 ${loadingMedia ? "animate-spin" : ""}`} /> Refresh posts</Button></div>
              <select value={form.mediaId} onChange={(e) => setForm({ ...form, mediaId: e.target.value })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Select a post or Reel</option>{media.map((item) => <option key={item.id} value={item.id}>{item.media_product_type || item.media_type || "POST"} — {(item.caption || "Untitled post").slice(0, 90)}</option>)}</select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Keywords</Label><Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="ARM, ROBOT ARM" /><p className="text-xs text-muted-foreground">Comma-separated; matching ignores uppercase/lowercase.</p></div><div className="grid gap-2"><Label>Match rule</Label><select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value })} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="contains">Comment contains keyword</option><option value="exact">Exact comment only</option><option value="any_word">Whole word match</option></select></div></div>
            <div className="grid gap-2"><Label>Start from a message preset</Label><div className="flex flex-wrap gap-2">{PRESETS.map((preset) => <Button key={preset.name} type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, publicReply: preset.publicReply, privateReply: preset.privateReply, finalMessage: preset.finalMessage, finalButtonText: preset.button })}>{preset.name}</Button>)}</div></div>
            <div className="grid gap-2"><Label>Public comment reply</Label><Textarea value={form.publicReply} onChange={(e) => setForm({ ...form, publicReply: e.target.value })} /><p className="text-xs text-muted-foreground">Available variables: {"{{username}}"} and {"{{keyword}}"}</p></div>
            <div className="grid gap-2"><Label>First private reply</Label><Textarea value={form.privateReply} onChange={(e) => setForm({ ...form, privateReply: e.target.value })} /><p className="text-xs text-amber-500">Meta permits one private reply within 7 days. The visitor must respond before the final button can be sent.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Confirmation word</Label><Input value={form.confirmationWord} onChange={(e) => setForm({ ...form, confirmationWord: e.target.value.toUpperCase() })} /></div><div className="grid gap-2"><Label>Button text</Label><Input maxLength={20} value={form.finalButtonText} onChange={(e) => setForm({ ...form, finalButtonText: e.target.value })} /></div></div>
            <div className="grid gap-2"><Label>Final message</Label><Textarea value={form.finalMessage} onChange={(e) => setForm({ ...form, finalMessage: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Final source/guide link</Label><Input type="url" value={form.finalLinkUrl} onChange={(e) => setForm({ ...form, finalLinkUrl: e.target.value })} placeholder="https://your-site.com/robot-arm-guide" /></div>
            <label className="flex items-start gap-3 rounded-xl border border-border/60 p-4"><Switch checked={form.scanExisting} onCheckedChange={(checked) => setForm({ ...form, scanExisting: checked })} /><span><span className="block text-sm font-semibold">Scan existing comments with cron</span><span className="mt-1 block text-xs text-muted-foreground">Old comments can receive a public reply. Instagram private replies are limited to comments from the last 7 days.</span></span></label>
            <div className="flex justify-end gap-2 border-t pt-4"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving || loadingMedia} className="bg-indigo-600 text-white hover:bg-indigo-700">{saving ? "Creating…" : "Create automation"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
