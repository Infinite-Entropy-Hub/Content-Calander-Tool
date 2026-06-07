import { supabase } from "./supabase";

export interface Post {
  id?: string;
  created_at?: string;
  title: string;
  description: string;
  platform: 'instagram' | 'youtube' | 'both';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publish_mode: 'auto' | 'manual';
  scheduled_for: string | null;
  published_at?: string | null;
  media_url?: string | null;
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
  return data as Post[];
}

export async function createPost(post: Post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    throw error;
  }
  return data;
}

export async function updatePost(id: string, updates: Partial<Post>) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error updating post:", error);
    throw error;
  }
  return data;
}

export async function deletePost(id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
  return true;
}

// Upload file to Supabase Storage
export async function uploadMedia(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading media:", uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data } = supabase.storage.from('media').getPublicUrl(filePath);
  return data.publicUrl;
}
