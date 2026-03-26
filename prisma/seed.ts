/**
 * Prisma seed — expenses-api
 * Run: npx prisma db seed
 * (configured in package.json → "prisma": { "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts" })
 */
import {
  PrismaClient,
  ExpenseSource,
  ExpenseStatus,
  AccountType,
  GroupRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Global categories (groupId = null → available to all groups) ──────────────

const GLOBAL_CATEGORIES = [
  { name: 'Supermercado',        icon: '🛒' },
  { name: 'Salud',               icon: '💊' },
  { name: 'Óptica',              icon: '👓' },
  { name: 'Restaurante',         icon: '🍽️' },
  { name: 'Servicios Digitales', icon: '📱' },
  { name: 'Hogar',               icon: '🏠' },
  { name: 'Transporte',          icon: '🚗' },
  { name: 'Educación',           icon: '📚' },
  { name: 'Ropa',                icon: '👕' },
  { name: 'Entretenimiento',     icon: '🎬' },
  { name: 'Efectivo',            icon: '💵' },
  { name: 'Otros',               icon: '📦' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱  Seeding database…');

  // ── 1. Global categories (idempotent upsert) ────────────────────────────────
  console.log('  → Global categories');
  const categoryMap: Record<string, string> = {};
  for (const cat of GLOBAL_CATEGORIES) {
    const record = await prisma.category.upsert({
      // groupId is null for global categories; use name as unique key
      where: {
        groupId_name: {
          groupId: null as unknown as string, // Prisma upsert requires the compound key
          name: cat.name,
        },
      },
      update: { icon: cat.icon },
      create: { name: cat.name, icon: cat.icon, groupId: null },
    });
    categoryMap[cat.name] = record.id;
  }

  // ── 2. Admin user ───────────────────────────────────────────────────────────
  console.log('  → Admin user  (admin@expenses.local / Admin1234!)');
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@expenses.local' },
    update: {},
    create: {
      email: 'admin@expenses.local',
      passwordHash,
      name: 'Admin',
    },
  });

  // ── 3. Demo group ───────────────────────────────────────────────────────────
  console.log('  → Group "Familia Demo"');
  const GROUP_ID = 'seed-group-familia-demo';
  const group = await prisma.group.upsert({
    where: { id: GROUP_ID },
    update: {},
    create: {
      id: GROUP_ID,
      name: 'Familia Demo',
      description: 'Grupo de ejemplo para explorar la aplicación',
      currency: 'USD',
    },
  });

  // ── 4. Group membership ─────────────────────────────────────────────────────
  await prisma.groupMembership.upsert({
    where: { userId_groupId: { userId: admin.id, groupId: group.id } },
    update: {},
    create: { userId: admin.id, groupId: group.id, role: GroupRole.GROUP_ADMIN },
  });

  // ── 5. Financial members ────────────────────────────────────────────────────
  console.log('  → Members');
  const memberA = await prisma.member.upsert({
    where: { groupId_name: { groupId: group.id, name: 'Persona A' } },
    update: {},
    create: {
      groupId: group.id,
      userId:  admin.id,
      name:    'Persona A',
      color:   '#6366f1',
    },
  });

  const memberB = await prisma.member.upsert({
    where: { groupId_name: { groupId: group.id, name: 'Persona B' } },
    update: {},
    create: {
      groupId: group.id,
      name:    'Persona B',
      color:   '#ec4899',
    },
  });

  // ── 6. Account ──────────────────────────────────────────────────────────────
  console.log('  → Account "Tarjeta Principal"');
  const account = await prisma.account.upsert({
    where: { groupId_name: { groupId: group.id, name: 'Tarjeta Principal' } },
    update: {},
    create: {
      groupId:  group.id,
      name:     'Tarjeta Principal',
      type:     AccountType.CREDIT_CARD,
      currency: 'USD',
    },
  });

  // ── 7. Sample expenses ──────────────────────────────────────────────────────
  console.log('  → Sample expenses');
  const now          = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear  = String(now.getFullYear());

  // Expense A — PENDING, CARD, Supermercado (no assignments yet)
  await prisma.expense.upsert({
    where: { id: 'seed-expense-supermercado' },
    update: {},
    create: {
      id:          'seed-expense-supermercado',
      groupId:     group.id,
      accountId:   account.id,
      categoryId:  categoryMap['Supermercado'],
      description: 'Compra semanal supermercado',
      amount:      85.50,
      currency:    'USD',
      source:      ExpenseSource.CARD,
      status:      ExpenseStatus.PENDING,
      date:        new Date(now.getFullYear(), now.getMonth(), 5),
      month:       currentMonth,
      year:        currentYear,
    },
  });

  // Expense B — CLASSIFIED + ASSIGNED, DIGITAL_WALLET, Servicios Digitales (60/40 split)
  const expenseB = await prisma.expense.upsert({
    where: { id: 'seed-expense-streaming' },
    update: {},
    create: {
      id:          'seed-expense-streaming',
      groupId:     group.id,
      accountId:   account.id,
      categoryId:  categoryMap['Servicios Digitales'],
      description: 'Suscripción streaming mensual',
      amount:      15.99,
      currency:    'USD',
      source:      ExpenseSource.DIGITAL_WALLET,
      status:      ExpenseStatus.ASSIGNED,
      date:        new Date(now.getFullYear(), now.getMonth(), 1),
      month:       currentMonth,
      year:        currentYear,
    },
  });

  await prisma.assignment.upsert({
    where: { expenseId_memberId: { expenseId: expenseB.id, memberId: memberA.id } },
    update: {},
    create: { expenseId: expenseB.id, memberId: memberA.id, percentage: 60 },
  });
  await prisma.assignment.upsert({
    where: { expenseId_memberId: { expenseId: expenseB.id, memberId: memberB.id } },
    update: {},
    create: { expenseId: expenseB.id, memberId: memberB.id, percentage: 40 },
  });

  // Expense C — IMPORTED, CASH, Transporte
  await prisma.expense.upsert({
    where: { importHash: 'seed-import-hash-combustible-001' },
    update: {},
    create: {
      id:          'seed-expense-combustible',
      groupId:     group.id,
      categoryId:  categoryMap['Transporte'],
      description: 'Combustible / Nafta',
      amount:      60.00,
      currency:    'USD',
      source:      ExpenseSource.CASH,
      status:      ExpenseStatus.IMPORTED,
      date:        new Date(now.getFullYear(), now.getMonth(), 10),
      month:       currentMonth,
      year:        currentYear,
      importHash:  'seed-import-hash-combustible-001',
    },
  });

  console.log('');
  console.log('✅  Seed completed.');
  console.log(`    Admin:  admin@expenses.local  /  Admin1234!`);
  console.log(`    Group:  ${group.name}  (id: ${group.id})`);
  console.log(`    Members: ${memberA.name} (${memberA.color})  |  ${memberB.name} (${memberB.color})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
