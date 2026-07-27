import { prisma } from "@/lib/db";
import { deleteStoredMedia } from "@/lib/storage";

export const RECORDING_RETENTION_DAYS = 30;

export async function cleanupExpiredRecordings(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - RECORDING_RETENTION_DAYS);

  const expired = await prisma.answer.findMany({
    where: {
      videoUrl: { not: null },
      createdAt: { lt: cutoff },
    },
    select: { id: true, videoUrl: true },
  });

  let deleted = 0;
  let failed = 0;

  for (const answer of expired) {
    try {
      await deleteStoredMedia(answer.videoUrl);
      await prisma.answer.update({
        where: { id: answer.id },
        data: { videoUrl: null },
      });
      deleted += 1;
    } catch (err) {
      failed += 1;
      console.error("[cleanup] failed to delete recording", answer.id, err);
    }
  }

  return {
    scanned: expired.length,
    deleted,
    failed,
    cutoff: cutoff.toISOString(),
  };
}
