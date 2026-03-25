import { PrismaClient, ExpenseCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  const [alice, bob, carol] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice Smith',
        password: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob Johnson',
        password: await bcrypt.hash('password123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'carol@example.com' },
      update: {},
      create: {
        email: 'carol@example.com',
        name: 'Carol Williams',
        password: await bcrypt.hash('password123', 10),
      },
    }),
  ]);

  const group = await prisma.group.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Weekend Trip',
      description: 'Shared expenses for the weekend trip',
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { userId: alice.id, groupId: group.id, role: 'ADMIN' },
      { userId: bob.id, groupId: group.id, role: 'MEMBER' },
      { userId: carol.id, groupId: group.id, role: 'MEMBER' },
    ],
    skipDuplicates: true,
  });

  await prisma.expense.createMany({
    data: [
      {
        title: 'Groceries',
        description: 'Weekly groceries for the trip',
        amount: 85.50,
        currency: 'USD',
        category: ExpenseCategory.FOOD,
        paidById: alice.id,
        groupId: group.id,
      },
      {
        title: 'Gas Station',
        amount: 60.00,
        currency: 'USD',
        category: ExpenseCategory.TRANSPORT,
        paidById: bob.id,
        groupId: group.id,
      },
      {
        title: 'Airbnb',
        description: '2 nights at the cabin',
        amount: 300.00,
        currency: 'USD',
        category: ExpenseCategory.ACCOMMODATION,
        paidById: carol.id,
        groupId: group.id,
      },
      {
        title: 'Monthly Gym',
        amount: 45.00,
        currency: 'USD',
        category: ExpenseCategory.HEALTH,
        paidById: alice.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed successfully.');
  console.log('Seed users (password: password123):');
  console.log('  alice@example.com');
  console.log('  bob@example.com');
  console.log('  carol@example.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
