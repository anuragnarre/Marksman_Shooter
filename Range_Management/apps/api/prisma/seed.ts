// apps/api/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Create shooter
  const shooter = await prisma.user.upsert({
    where: { email: 'shooter@example.com' },
    update: {},
    create: {
      name: 'Alex Marksman',
      email: 'shooter@example.com',
      passwordHash,
      role: Role.SHOOTER,
    },
  });

  // Create coach
  const coach = await prisma.user.upsert({
    where: { email: 'coach@example.com' },
    update: {},
    create: {
      name: 'Jordan Coach',
      email: 'coach@example.com',
      passwordHash,
      role: Role.COACH,
    },
  });

  // Create coach connection (approved)
  await prisma.coachConnection.upsert({
    where: { id: 'seed-connection-1' },
    update: {},
    create: {
      id: 'seed-connection-1',
      shooterId: shooter.id,
      coachId: coach.id,
      status: 'APPROVED',
    },
  });

  // Create range operator
  const rangeOp = await prisma.user.upsert({
    where: { email: 'range@example.com' },
    update: {},
    create: {
      name: 'Riley Range',
      email: 'range@example.com',
      passwordHash,
      role: Role.RANGE_OPERATOR,
    },
  });

  // Create shooting range
  const range = await prisma.shootingRange.upsert({
    where: { code: 'TEST01' },
    update: {},
    create: {
      name: 'Marksman Test Range',
      code: 'TEST01',
      ownerId: rangeOp.id,
      address: '123 Precision Way',
    },
  });


  // Create session 1
  const session1 = await prisma.session.upsert({
    where: { id: 'seed-session-1' },
    update: {},
    create: {
      id: 'seed-session-1',
      shooterId: shooter.id,
      discipline: '10m Air Rifle',
      distance: 10,
      weaponType: 'Air Rifle',
      numberOfShots: 10,
      sessionDate: new Date('2024-01-15T09:00:00Z'),
    },
  });

  // Create session 2
  const session2 = await prisma.session.upsert({
    where: { id: 'seed-session-2' },
    update: {},
    create: {
      id: 'seed-session-2',
      shooterId: shooter.id,
      discipline: '10m Air Rifle',
      distance: 10,
      weaponType: 'Air Rifle',
      numberOfShots: 10,
      sessionDate: new Date('2024-01-22T09:00:00Z'),
    },
  });

  // 10 shots for session 1 — good grouping near center
  const shotsSession1 = [
    { shotNumber: 1, score: 9.8, x: 0.3, y: 0.2 },
    { shotNumber: 2, score: 9.5, x: -0.4, y: 0.5 },
    { shotNumber: 3, score: 10.2, x: 0.1, y: -0.1 },
    { shotNumber: 4, score: 9.1, x: -0.8, y: 0.3 },
    { shotNumber: 5, score: 9.7, x: 0.5, y: -0.4 },
    { shotNumber: 6, score: 8.9, x: 1.2, y: -0.6 },
    { shotNumber: 7, score: 9.4, x: -0.2, y: 0.8 },
    { shotNumber: 8, score: 10.1, x: 0.0, y: 0.0 },
    { shotNumber: 9, score: 9.6, x: 0.4, y: -0.3 },
    { shotNumber: 10, score: 9.3, x: -0.6, y: 0.4 },
  ];

  // 10 shots for session 2 — slightly drifting right
  const shotsSession2 = [
    { shotNumber: 1, score: 9.2, x: 0.8, y: 0.1 },
    { shotNumber: 2, score: 8.8, x: 1.1, y: -0.3 },
    { shotNumber: 3, score: 9.0, x: 0.9, y: 0.4 },
    { shotNumber: 4, score: 8.5, x: 1.5, y: -0.2 },
    { shotNumber: 5, score: 9.1, x: 0.7, y: 0.3 },
    { shotNumber: 6, score: 8.7, x: 1.3, y: -0.5 },
    { shotNumber: 7, score: 9.3, x: 0.6, y: 0.2 },
    { shotNumber: 8, score: 8.4, x: 1.6, y: -0.1 },
    { shotNumber: 9, score: 8.9, x: 0.8, y: 0.5 },
    { shotNumber: 10, score: 8.6, x: 1.2, y: -0.4 },
  ];

  for (const shot of shotsSession1) {
    await prisma.shot.create({
      data: { ...shot, sessionId: session1.id },
    });
  }

  for (const shot of shotsSession2) {
    await prisma.shot.create({
      data: { ...shot, sessionId: session2.id },
    });
  }

  // Coach feedback on session 1
  await prisma.coachFeedback.create({
    data: {
      coachId: coach.id,
      sessionId: session1.id,
      feedback:
        'Excellent session! Your grouping is tight and consistent. Focus on maintaining this trigger control in your next session.',
    },
  });

  console.log(`Seeded:
  - Users: ${shooter.email} (SHOOTER), ${coach.email} (COACH), ${rangeOp.email} (RANGE_OPERATOR)
  - Range: ${range.name} (Code: ${range.code})
  - Sessions: ${session1.id}, ${session2.id}
  - Shots: 20 total (10 per session)
  - Connection: shooter ↔ coach (APPROVED)
  - Feedback: 1 coach comment on session 1`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
