import { prisma } from "../src/lib/db/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "system@sangamvivah.internal" } });
  if (existing) {
    console.log("System user already exists:", existing.id);
    return;
  }

  const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);

  const user = await prisma.user.create({
    data: {
      name: "System",
      email: "system@sangamvivah.internal",
      password: randomPassword, // never used to log in — no login route should allow this account
      role: "ADMIN",
      active: false, // inactive so it can never actually log in, even if someone tried
    },
  });

  console.log("Created system user:", user.id);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });