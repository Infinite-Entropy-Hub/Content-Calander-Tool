import { NextResponse } from "next/server";
import { publishToFacebook } from "@/lib/publishFacebook";

export async function POST(req: Request) {
  try {
    const { postId, userId } = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "Missing postId or userId" }, { status: 400 });
    }

    const fbPostId = await publishToFacebook(postId, userId);

    return NextResponse.json({ success: true, fbPostId });
  } catch (error: any) {
    console.error("Facebook Publish Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
