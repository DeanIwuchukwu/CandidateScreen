import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export function isR2Storage() {
  return (
    process.env.STORAGE_DRIVER === "r2" &&
    Boolean(process.env.R2_ACCOUNT_ID) &&
    Boolean(process.env.R2_ACCESS_KEY_ID) &&
    Boolean(process.env.R2_SECRET_ACCESS_KEY) &&
    Boolean(process.env.R2_BUCKET_NAME)
  );
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID!;
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

function bucketName() {
  return process.env.R2_BUCKET_NAME!;
}

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export function videoObjectKey(responseId: string, questionId: string) {
  return `videos/${responseId}/${questionId}.webm`;
}

export function resumeObjectKey(applicationId: string, originalName: string) {
  const ext = path.extname(originalName).slice(0, 8) || ".pdf";
  return `resumes/${applicationId}${ext}`;
}

export function isR2ObjectKey(value: string) {
  return value.startsWith("videos/") || value.startsWith("resumes/");
}

export function isLegacyMediaUrl(value: string) {
  return value.startsWith("/api/media/");
}

export async function createVideoUploadUrl(objectKey: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName(),
    Key: objectKey,
    ContentType: "video/webm",
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 15 * 60 });
}

export async function getSignedObjectUrl(objectKey: string, expiresInSec = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucketName(),
    Key: objectKey,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSec });
}

export async function putObject(
  objectKey: string,
  buffer: Buffer,
  contentType: string,
) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return objectKey;
}

export async function resolveMediaUrl(storedValue: string | null | undefined) {
  if (!storedValue) return null;
  if (isR2ObjectKey(storedValue) && isR2Storage()) {
    return getSignedObjectUrl(storedValue);
  }
  return storedValue;
}

export async function saveVideo(fileName: string, buffer: Buffer): Promise<string> {
  if (isR2Storage()) {
    const objectKey = fileName.includes("/")
      ? fileName
      : `videos/legacy/${fileName}`;
    await putObject(objectKey, buffer, "video/webm");
    return objectKey;
  }

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

export function resumeFileName(applicationId: string, originalName: string) {
  const ext = path.extname(originalName).slice(0, 8) || ".pdf";
  return `resume-${applicationId}${ext}`;
}

function resumeContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

export async function saveResume(
  applicationId: string,
  originalName: string,
  buffer: Buffer,
): Promise<string> {
  if (isR2Storage()) {
    const objectKey = resumeObjectKey(applicationId, originalName);
    await putObject(objectKey, buffer, resumeContentType(originalName));
    return objectKey;
  }

  const fileName = resumeFileName(applicationId, originalName);
  await ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);
  return `/api/media/${fileName}`;
}
