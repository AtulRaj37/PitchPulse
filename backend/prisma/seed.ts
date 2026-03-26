// Database Seed
// Initial data for development and testing

import { PrismaClient, UserRole, MatchFormat, MatchStatus, PlayerRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // ============================================
  // USERS
  // ============================================

  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pitchpulse.com' },
    update: {},
    create: {
      email: 'admin@pitchpulse.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  const scorerUser = await prisma.user.upsert({
    where: { email: 'scorer@pitchpulse.com' },
    update: {},
    create: {
      email: 'scorer@pitchpulse.com',
      name: 'Match Scorer',
      password: hashedPassword,
      role: UserRole.SCORER,
      emailVerified: true,
    },
  });

  console.log('✅ Users created');

  // ============================================
  // TEAMS
  // ============================================

  const team1 = await prisma.team.upsert({
    where: { id: 'team-mumbai-warriors' },
    update: {},
    create: {
      id: 'team-mumbai-warriors',
      name: 'Mumbai Warriors',
      shortName: 'MW',
      homeGround: 'Wankhede Stadium',
      createdBy: adminUser.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { id: 'team-delhi-dynamite' },
    update: {},
    create: {
      id: 'team-delhi-dynamite',
      name: 'Delhi Dynamite',
      shortName: 'DD',
      homeGround: 'Arun Jaitley Stadium',
      createdBy: adminUser.id,
    },
  });

  const team3 = await prisma.team.upsert({
    where: { id: 'team-bangalore-blast' },
    update: {},
    create: {
      id: 'team-bangalore-blast',
      name: 'Bangalore Blast',
      shortName: 'BB',
      homeGround: 'M. Chinnaswamy Stadium',
      createdBy: adminUser.id,
    },
  });

  const team4 = await prisma.team.upsert({
    where: { id: 'team-chennai-champions' },
    update: {},
    create: {
      id: 'team-chennai-champions',
      name: 'Chennai Champions',
      shortName: 'CC',
      homeGround: 'MA Chidambaram Stadium',
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Teams created');

  // ============================================
  // PLAYERS
  // ============================================

  const players = [
    // Team 1 Players
    { id: 'player-rv', name: 'Rohit Verma', teamId: team1.id, role: PlayerRole.BATSMAN, jerseyNumber: 45 },
    { id: 'player-sk', name: 'Suresh Kumar', teamId: team1.id, role: PlayerRole.ALL_ROUNDER, jerseyNumber: 12 },
    { id: 'player-vk', name: 'Virat Kohli', teamId: team1.id, role: PlayerRole.BATSMAN, jerseyNumber: 18 },
    { id: 'player-rj', name: 'Ravichandran Jadeja', teamId: team1.id, role: PlayerRole.ALL_ROUNDER, jerseyNumber: 8 },
    { id: 'player-bk', name: 'Bhuvneshwar Kumar', teamId: team1.id, role: PlayerRole.BOWLER, jerseyNumber: 15 },
    { id: 'player-jb', name: 'Jasprit Bumrah', teamId: team1.id, role: PlayerRole.BOWLER, jerseyNumber: 93 },
    { id: 'player-ms', name: 'Mahendra Singh Dhoni', teamId: team1.id, role: PlayerRole.WICKET_KEEPER_BATSMAN, jerseyNumber: 7 },
    { id: 'player-hp', name: 'Hardik Pandya', teamId: team1.id, role: PlayerRole.ALL_ROUNDER, jerseyNumber: 33 },
    { id: 'player-rp', name: 'Rohit Sharma', teamId: team1.id, role: PlayerRole.BATSMAN, jerseyNumber: 17 },
    { id: 'player-sk2', name: 'Shubman Gill', teamId: team1.id, role: PlayerRole.BATSMAN, jerseyNumber: 77 },
    { id: 'player-ah', name: 'Ashwin Hasan', teamId: team1.id, role: PlayerRole.BOWLER, jerseyNumber: 99 },

    // Team 2 Players
    { id: 'player-rl', name: 'Rishabh Pant', teamId: team2.id, role: PlayerRole.WICKET_KEEPER_BATSMAN, jerseyNumber: 17 },
    { id: 'player-ak', name: 'Axar Patel', teamId: team2.id, role: PlayerRole.ALL_ROUNDER, jerseyNumber: 20 },
    { id: 'player-dk', name: 'Devdutt Padikkal', teamId: team2.id, role: PlayerRole.BATSMAN, jerseyNumber: 72 },
    { id: 'player-sk3', name: 'Shreyas Iyer', teamId: team2.id, role: PlayerRole.BATSMAN, jerseyNumber: 41 },
    { id: 'player-kp', name: 'Kuldeep Yadav', teamId: team2.id, role: PlayerRole.BOWLER, jerseyNumber: 23 },
    { id: 'player-ns', name: 'Naveen Kumar', teamId: team2.id, role: PlayerRole.BOWLER, jerseyNumber: 45 },
    { id: 'player-pr', name: 'Prithvi Shaw', teamId: team2.id, role: PlayerRole.BATSMAN, jerseyNumber: 54 },
    { id: 'player-ls', name: 'Lalit Yadav', teamId: team2.id, role: PlayerRole.ALL_ROUNDER, jerseyNumber: 62 },
    { id: 'player-ms2', name: 'Mohammed Shami', teamId: team2.id, role: PlayerRole.BOWLER, jerseyNumber: 11 },
    { id: 'player-ys', name: 'Yash Dhull', teamId: team2.id, role: PlayerRole.BATSMAN, jerseyNumber: 26 },
    { id: 'player-ri', name: 'Ripal Patel', teamId: team2.id, role: PlayerRole.BOWLER, jerseyNumber: 88 },
  ];

  for (const player of players) {
    await prisma.player.upsert({
      where: { id: player.id },
      update: {},
      create: player,
    });
  }

  console.log('✅ Players created');

  // ============================================
  // TOURNAMENT
  // ============================================

  const tournament = await prisma.tournament.upsert({
    where: { id: 'tournament-summer-2024' },
    update: {},
    create: {
      id: 'tournament-summer-2024',
      name: 'Summer Cricket League 2024',
      description: 'Annual summer cricket tournament for local clubs',
      format: MatchFormat.T20,
      overs: 20,
      maxTeams: 8,
      minTeams: 4,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-07-15'),
      status: 'IN_PROGRESS',
      venue: 'City Cricket Ground',
      organizerId: adminUser.id,
    },
  });

  // Add teams to tournament
  await prisma.tournamentTeam.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId: tournament.id,
        teamId: team1.id,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      teamId: team1.id,
      status: 'CONFIRMED',
    },
  });

  await prisma.tournamentTeam.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId: tournament.id,
        teamId: team2.id,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      teamId: team2.id,
      status: 'CONFIRMED',
    },
  });

  console.log('✅ Tournament created');

  // ============================================
  // DEMO MATCH
  // ============================================

  const demoMatch = await prisma.match.upsert({
    where: { id: 'match-demo-001' },
    update: {},
    create: {
      id: 'match-demo-001',
      team1Id: team1.id,
      team2Id: team2.id,
      venue: 'Wankhede Stadium, Mumbai',
      startTime: new Date(),
      status: 'LIVE', // Using 'LIVE' instead of MatchStatus.IN_PROGRESS
      format: MatchFormat.T20,
      overs: 20,
      currentOver: 12,
      currentBall: 3,
      tournamentId: tournament.id,
      createdBy: scorerUser.id,
    },
  });

  // Add players to match
  const matchPlayers = [
    { matchId: demoMatch.id, playerId: 'player-rv', teamId: team1.id, battingOrder: 1, isCaptain: false },
    { matchId: demoMatch.id, playerId: 'player-sk', teamId: team1.id, battingOrder: 2, isCaptain: true },
    { matchId: demoMatch.id, playerId: 'player-vk', teamId: team1.id, battingOrder: 3 },
    { matchId: demoMatch.id, playerId: 'player-ms', teamId: team1.id, battingOrder: 4, isWicketKeeper: true },
    { matchId: demoMatch.id, playerId: 'player-rj', teamId: team1.id, battingOrder: 5 },
    { matchId: demoMatch.id, playerId: 'player-hp', teamId: team1.id, battingOrder: 6 },
    { matchId: demoMatch.id, playerId: 'player-rp', teamId: team1.id, battingOrder: 7 },
    { matchId: demoMatch.id, playerId: 'player-sk2', teamId: team1.id, battingOrder: 8 },
    { matchId: demoMatch.id, playerId: 'player-bk', teamId: team1.id, battingOrder: 9 },
    { matchId: demoMatch.id, playerId: 'player-jb', teamId: team1.id, battingOrder: 10 },
    { matchId: demoMatch.id, playerId: 'player-ah', teamId: team1.id, battingOrder: 11 },

    { matchId: demoMatch.id, playerId: 'player-pr', teamId: team2.id, battingOrder: 1 },
    { matchId: demoMatch.id, playerId: 'player-dk', teamId: team2.id, battingOrder: 2 },
    { matchId: demoMatch.id, playerId: 'player-sk3', teamId: team2.id, battingOrder: 3, isCaptain: true },
    { matchId: demoMatch.id, playerId: 'player-rl', teamId: team2.id, battingOrder: 4, isWicketKeeper: true },
    { matchId: demoMatch.id, playerId: 'player-ls', teamId: team2.id, battingOrder: 5 },
    { matchId: demoMatch.id, playerId: 'player-ys', teamId: team2.id, battingOrder: 6 },
    { matchId: demoMatch.id, playerId: 'player-ak', teamId: team2.id, battingOrder: 7 },
    { matchId: demoMatch.id, playerId: 'player-kp', teamId: team2.id, battingOrder: 8 },
    { matchId: demoMatch.id, playerId: 'player-ns', teamId: team2.id, battingOrder: 9 },
    { matchId: demoMatch.id, playerId: 'player-ms2', teamId: team2.id, battingOrder: 10 },
    { matchId: demoMatch.id, playerId: 'player-ri', teamId: team2.id, battingOrder: 11 },
  ];

  for (const mp of matchPlayers) {
    await prisma.matchPlayer.upsert({
      where: {
        matchId_playerId: {
          matchId: mp.matchId,
          playerId: mp.playerId,
        },
      },
      update: {},
      create: mp,
    });
  }

  // Create innings
  await prisma.innings.upsert({
    where: {
      matchId_inningsNumber: {
        matchId: demoMatch.id,
        inningsNumber: 1,
      },
    },
    update: {},
    create: {
      matchId: demoMatch.id,
      inningsNumber: 1,
      battingTeamId: team1.id,
      bowlingTeamId: team2.id,
      totalRuns: 142,
      totalWickets: 4,
      overs: 12.3,
      balls: 75,
      runRate: 11.36,
    },
  });

  // Create batting stats
  await prisma.battingStats.upsert({
    where: {
      inningsId_playerId: {
        inningsId: 'innings-1',
        playerId: 'player-rv',
      },
    },
    update: {},
    create: {
      inningsId: 'innings-1',
      playerId: 'player-rv',
      position: 1,
      runs: 67,
      balls: 42,
      fours: 6,
      sixes: 2,
      strikeRate: 159.52,
      isNotOut: true,
    },
  });

  await prisma.battingStats.upsert({
    where: {
      inningsId_playerId: {
        inningsId: 'innings-1',
        playerId: 'player-sk',
      },
    },
    update: {},
    create: {
      inningsId: 'innings-1',
      playerId: 'player-sk',
      position: 2,
      runs: 23,
      balls: 18,
      fours: 3,
      sixes: 1,
      strikeRate: 127.78,
      dismissal: 'c pr b kp',
      dismissalType: 'CAUGHT',
      bowlerId: 'player-kp',
      isOut: true,
    },
  });

  // Create bowling stats
  await prisma.bowlingStats.upsert({
    where: {
      inningsId_playerId: {
        inningsId: 'innings-1',
        playerId: 'player-kp',
      },
    },
    update: {},
    create: {
      inningsId: 'innings-1',
      playerId: 'player-kp',
      overs: 4,
      balls: 24,
      maidens: 0,
      runs: 32,
      wickets: 2,
      economy: 8.0,
      fours: 2,
      sixes: 1,
      wides: 1,
      noBalls: 0,
    },
  });

  console.log('✅ Demo match created');

  console.log('🎉 Database seed completed successfully!');
  console.log(`
📝 Test Credentials:
   Admin: admin@pitchpulse.com / password123
   Scorer: scorer@pitchpulse.com / password123
  `);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
