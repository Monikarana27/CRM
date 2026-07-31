const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const p = await prisma.profile.findUnique({
    where: { id: 'cmruk29cm0034u19gg66e843k' },
    include: { partnerPreference: true },
  });
  console.log(JSON.stringify(p.partnerPreference, null, 2));
  await prisma.$disconnect();
})();
