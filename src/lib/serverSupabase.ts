import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The project does not generate Supabase database types yet, so the server client is intentionally untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serviceClient: SupabaseClient<any> | null = null;

export function getServiceSupabase() {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase service credentials");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serviceClient = createClient<any>(url, key, { auth: { persistSession: false } });
  }
  return serviceClient;
}

export async function requireUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized");
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}
