import { NextRequest, NextResponse } from "next/server";
import { readVideo } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  if (!CONTENT_TYPES[ext] || file.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readVideo(file);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext]!,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
