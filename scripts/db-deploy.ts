/**
 * Railway / production pre-deploy:
 * 1. Convert legacy VIEWER members & invites to RECRUITER
 * 2. prisma db push --accept-data-loss (required to drop VIEWER from the enum)
 *
 * Safe for workspaces that never used VIEWER — the UPDATE matches zero rows.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function convertLegacyViewers() {
  try {
    const members = await prisma.$executeRawUnsafe(`
      UPDATE "WorkspaceMember"
      SET role = 'RECRUITER'::"WorkspaceRole"
      WHERE role::text = 'VIEWER'
    `);
    const invites = await prisma.$executeRawUnsafe(`
      UPDATE "WorkspaceInvite"
      SET role = 'RECRUITER'::"WorkspaceRole"
      WHERE role::text = 'VIEWER'
    `);
    console.log(
      `[db-deploy] Converted VIEWER → RECRUITER (members=${members}, invites=${invites})`,
    );
  } catch (err) {
    console.warn(
      "[db-deploy] VIEWER conversion skipped (enum may already be updated):",
      err instanceof Error ? err.message : err,
    );
  }
}

async function main() {
  await convertLegacyViewers();
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
}

main()
  .catch((err) => {
    console.error("[db-deploy] failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
