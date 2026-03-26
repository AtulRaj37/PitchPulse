import { PrismaClient } from '@prisma/client';
import { rebuildProjections } from '../src/event-sourcing/projections/projection-handler';

const prisma = new PrismaClient();

async function run() {
  const latestMatch = await prisma.match.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  });

  if (!latestMatch) {
    console.error('No matches found in the database');
    return;
  }

  const matchId = latestMatch.id;
  console.log('Restoring projections for latest match:', matchId);
  const result = await rebuildProjections(matchId);
  console.log('Rebuild result:', result);
}

run().finally(() => prisma.$disconnect());
