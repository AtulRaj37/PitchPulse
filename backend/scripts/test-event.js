const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.event.count({ where: { matchId: "7750a5bd-6947-4423-8300-7dd960b16049" } });
  console.log('Events Count:', count);
  const events = await prisma.event.findMany({ 
    where: { matchId: "7750a5bd-6947-4423-8300-7dd960b16049" },
    orderBy: { sequenceNumber: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(events, null, 2));
}
run().finally(() => prisma.$disconnect());
