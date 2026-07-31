const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const client = await prisma.profile.findFirst({
    where: { subscriptions: { some: { status: 'ACTIVE' } } },
    include: { subscriptions: true },
  });
  if (!client) {
    console.log('No profile with an active subscription found.');
  } else {
    console.log('Use this profileId:', client.id);
    console.log('Name:', client.name, '| Code:', client.profileCode);
  }
  await prisma.$disconnect();
})();
