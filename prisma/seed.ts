import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const salesPassword = await bcrypt.hash("Sales@123", 12);
  const servicePassword = await bcrypt.hash("Service@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@sangamcrm.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@sangamcrm.com",
      password: adminPassword,
      role: Role.ADMIN,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@sangamcrm.com" },
    update: {},
    create: {
      name: "Sales Executive",
      email: "sales@sangamcrm.com",
      password: salesPassword,
      role: Role.SALES,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "service@sangamcrm.com" },
    update: {},
    create: {
      name: "Service Executive",
      email: "service@sangamcrm.com",
      password: servicePassword,
      role: Role.SERVICE,
      active: true,
    },
  });

  console.log("Seed completed:");
  console.log("  admin@sangamcrm.com   / Admin@123   (ADMIN)");
  console.log("  sales@sangamcrm.com   / Sales@123   (SALES)");
  console.log("  service@sangamcrm.com / Service@123 (SERVICE)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });