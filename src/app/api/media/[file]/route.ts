import { NextRequest, NextResponse } from "next/server";
import { readVideo } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!file.endsWith(".webm") || file.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readVideo(file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "video/webm",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
