/**
 * scripts/fix-manager-ids.ts
 *
 * Backfills managerId for existing employees whose role has no visible
 * "Reports To" field in the form (PROFILE_CREATOR, ADMIN, HR, and any
 * extra SUPER_ADMINs) so they report to the primary Super Admin.
 *
 * Usage:
 *   npx tsx scripts/fix-manager-ids.ts            # dry run, prints what it WOULD do
 *   npx tsx scripts/fix-manager-ids.ts --apply     # actually writes changes
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NO_MANAGER_FIELD_ROLES = ["PROFILE_CREATOR", "ADMIN", "HR"] as const;

async function main() {
  const apply = process.argv.includes("--apply");

  // Pick the primary Super Admin: earliest-created active SUPER_ADMIN
  const primarySuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });

  if (!primarySuperAdmin) {
    console.error("No active Super Admin found. Aborting — nothing to assign as manager.");
    process.exit(1);
  }

  console.log(
    `Primary Super Admin: ${primarySuperAdmin.name} (${primarySuperAdmin.email}) [${primarySuperAdmin.id}]`
  );

  // Everyone who should report to the primary Super Admin:
  // - PROFILE_CREATOR, ADMIN, HR (always)
  // - any OTHER Super Admin (not the primary one itself)
  const targets = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: [...NO_MANAGER_FIELD_ROLES] } },
        { role: "SUPER_ADMIN", NOT: { id: primarySuperAdmin.id } },
      ],
    },
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });

  if (targets.length === 0) {
    console.log("No employees found needing a managerId update.");
    return;
  }

  console.log(`\nFound ${targets.length} employee(s) to update:\n`);

  const toChange = targets.filter((t) => t.managerId !== primarySuperAdmin.id);
  const alreadyCorrect = targets.length - toChange.length;

  for (const t of targets) {
    const status =
      t.managerId === primarySuperAdmin.id
        ? "already correct"
        : `${t.managerId ?? "null"} -> ${primarySuperAdmin.id}`;
    console.log(`  [${t.role}] ${t.name} (${t.email}) — ${status}`);
  }

  console.log(`\n${toChange.length} to update, ${alreadyCorrect} already correct.`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
    return;
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: toChange.map((t) => t.id) } },
    data: { managerId: primarySuperAdmin.id },
  });

  console.log(`\nDone. Updated ${result.count} employee(s).`);
}

main()
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });