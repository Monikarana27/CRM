import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: "admin@sangamcrm.com" },
  data: { role: "SUPER_ADMIN" },
}).then(() => prisma.$disconnect());