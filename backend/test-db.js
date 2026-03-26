const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const matches = await prisma.match.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { events: true }
  });
  console.log(JSON.stringify(matches.map(m => ({ id: m.id, status: m.status, eventsCount: m.events.length })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
