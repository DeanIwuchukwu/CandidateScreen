import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveVideo(fileName: string, buffer: Buffer): Promise<string> {
  await ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);
  return `/api/media/${fileName}`;
}

export async function readVideo(fileName: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, fileName));
}

export function videoFileName(responseId: string, questionId: string) {
  return `${responseId}-${questionId}.webm`;
}
