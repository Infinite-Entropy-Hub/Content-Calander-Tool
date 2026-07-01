import { NextResponse } from "next/server";
import { requireUser, getServiceSupabase } from "@/lib/serverSupabase";
import { META_API_VERSION } from "@/lib/metaAutomation";
import { getMetaConnection } from "@/lib/metaCredentials";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const supabase = getServiceSupabase();
    const { data: profile } = await supabase.from("profiles").select("api_keys").eq("id", user.id).single();
    const connection = getMetaConnection(profile?.api_keys);
    if (!connection) {
      return NextResponse.json({ error: "Connect your Meta token in Profile first." }, { status: 400 });
    }
    const token = connection.token;

    const pagesResponse = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const pages = await pagesResponse.json();
    if (!pagesResponse.ok) throw new Error(pages?.error?.message || "Could not load Meta Pages");
    const page = pages.data?.find((item: { instagram_business_account?: { id: string } }) => item.instagram_business_account?.id);
    if (!page) throw new Error("No Facebook Page with a connected Instagram Professional account was found.");

    const igId = page.instagram_business_account.id;
    const pageToken = page.access_token || token;
    const mediaResponse = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${igId}/media?fields=id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp&limit=50&access_token=${encodeURIComponent(pageToken)}`,
      { cache: "no-store" },
    );
    const media = await mediaResponse.json();
    if (!mediaResponse.ok) throw new Error(media?.error?.message || "Could not load Instagram media");

    return NextResponse.json({
      account: { id: igId, pageId: page.id, name: page.name },
      media: media.data || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load media";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
