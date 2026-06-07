import { NextResponse } from "next/server";
import { publishToInstagram } from "@/lib/publishInstagram";

export async function POST(req: Request) {
  try {
    const { postId, userId } = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "Missing postId or userId" }, { status: 400 });
    }

    const igPostId = await publishToInstagram(postId, userId);

    return NextResponse.json({ success: true, igPostId });
  } catch (error: any) {
    console.error("Instagram Publish Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
