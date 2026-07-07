/**
 * One-time migration: upload local uploads/ files to R2 and rewrite DB URLs.
 *
 * Usage: npx tsx scripts/migrate-media-to-r2.ts
 * Requires STORAGE_DRIVER=r2 and R2 env vars in .env
 */
import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  isR2Storage,
  putObject,
  resumeObjectKey,
  videoObjectKey,
} from "../src/lib/storage";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function resumeContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

async function main() {
  if (!isR2Storage()) {
    console.error("Set STORAGE_DRIVER=r2 and all R2_* env vars before running.");
    process.exit(1);
  }

  let migrated = 0;
  let skipped = 0;
  let missing = 0;
  let errors = 0;

  const answers = await prisma.answer.findMany({
    where: { videoUrl: { startsWith: "/api/media/" } },
  });

  for (const answer of answers) {
    const fileName = answer.videoUrl!.replace("/api/media/", "");
    const filePath = path.join(UPLOAD_DIR, fileName);

    try {
      const buffer = await readFile(filePath);
      const objectKey = videoObjectKey(answer.responseId, answer.questionId);
      await putObject(objectKey, buffer, "video/webm");
      await prisma.answer.update({
        where: { id: answer.id },
        data: { videoUrl: objectKey },
      });
      console.info(`[video] ${fileName} → ${objectKey}`);
      migrated++;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(`[video] missing file: ${fileName}`);
        missing++;
      } else {
        console.error(`[video] failed ${fileName}`, err);
        errors++;
      }
    }
  }

  const applications = await prisma.jobApplication.findMany({
    where: { resumeUrl: { startsWith: "/api/media/" } },
  });

  for (const app of applications) {
    const fileName = app.resumeUrl!.replace("/api/media/", "");
    const filePath = path.join(UPLOAD_DIR, fileName);

    try {
      const buffer = await readFile(filePath);
      const ext = path.extname(fileName) || ".pdf";
      const objectKey = resumeObjectKey(app.id, `file${ext}`);
      await putObject(objectKey, buffer, resumeContentType(fileName));
      await prisma.jobApplication.update({
        where: { id: app.id },
        data: { resumeUrl: objectKey },
      });
      console.info(`[resume] ${fileName} → ${objectKey}`);
      migrated++;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(`[resume] missing file: ${fileName}`);
        missing++;
      } else {
        console.error(`[resume] failed ${fileName}`, err);
        errors++;
      }
    }
  }

  const alreadyR2 =
    (await prisma.answer.count({ where: { videoUrl: { startsWith: "videos/" } } })) +
    (await prisma.jobApplication.count({ where: { resumeUrl: { startsWith: "resumes/" } } }));

  skipped = alreadyR2;

  try {
    const files = await readdir(UPLOAD_DIR);
    const orphanCount = files.length;
    if (orphanCount > 0) {
      console.info(`[info] ${orphanCount} file(s) remain in uploads/ (may be unreferenced)`);
    }
  } catch {
    // uploads dir may not exist
  }

  console.info("\nDone.", { migrated, skipped, missing, errors });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
