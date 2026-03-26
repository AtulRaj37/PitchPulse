import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.session.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!session) {
    console.log('No sessions found.');
    return;
  }

  console.log('Token fetch starting...');
  const res = await fetch('http://127.0.0.1:3001/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${session.token}`
    }
  });

  console.log('HTTP Status:', res.status);
  console.log('Response payload:', await res.json());

  await prisma.$disconnect();
}

main().catch(console.error);
