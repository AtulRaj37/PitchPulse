const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const match = await prisma.match.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { innings: { include: { battingStats: true, bowlingStats: true } } }
  });
  console.log(JSON.stringify(match, null, 2));
}
run().finally(() => prisma.$disconnect());
