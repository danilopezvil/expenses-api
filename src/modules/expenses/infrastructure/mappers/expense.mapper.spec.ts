import { Prisma } from '@prisma/client';
import { ExpenseMapper, AssignmentMapper } from './expense.mapper';
import { ExpenseAppMapper } from '../../application/mappers/expense-app.mapper';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { Assignment } from '../../domain/entities/assignment.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { Percentage } from '../../domain/value-objects/percentage.vo';
import { ImportHash } from '../../domain/value-objects/import-hash.vo';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** SHA-256 de 64 hex chars válido para ImportHash */
const VALID_HASH = 'a'.repeat(64);

type PrismaExpenseRow = Parameters<typeof ExpenseMapper.toDomain>[0];
type PrismaAssignmentRow = NonNullable<PrismaExpenseRow['assignments']>[number];

function makePrismaExpense(
  overrides: Partial<PrismaExpenseRow> = {},
): PrismaExpenseRow {
  return {
    id: 'exp-1',
    groupId: 'group-1',
    accountId: null,
    categoryId: null,
    description: 'Supermercado',
    amount: new Prisma.Decimal('85.50'),
    currency: 'USD',
    source: 'CARD',
    status: 'PENDING',
    date: new Date('2024-03-15'),
    month: '03',
    year: '2024',
    importHash: null,
    importId: null,
    createdAt: new Date('2024-03-15T10:00:00.000Z'),
    updatedAt: new Date('2024-03-15T10:00:00.000Z'),
    ...overrides,
  };
}

function makePrismaAssignment(
  overrides: Partial<PrismaAssignmentRow> = {},
): PrismaAssignmentRow {
  return {
    id: 'asgn-1',
    expenseId: 'exp-1',
    memberId: 'member-1',
    percentage: new Prisma.Decimal('60.00'),
    ...overrides,
  };
}

function makeDomainExpense(overrides: Partial<Parameters<typeof Expense.reconstitute>[0]> = {}): Expense {
  const base: Parameters<typeof Expense.reconstitute>[0] = {
    id: 'exp-1',
    groupId: 'group-1',
    description: 'Supermercado',
    amount: Money.create(85.50, 'USD'),
    source: ExpenseSource.CARD,
    status: ExpenseStatus.PENDING,
    date: new Date('2024-03-15'),
    month: '03',
    year: '2024',
    assignments: [],
    createdAt: new Date('2024-03-15T10:00:00.000Z'),
    updatedAt: new Date('2024-03-15T10:00:00.000Z'),
  };
  return Expense.reconstitute({ ...base, ...overrides });
}

// ── ExpenseMapper.toDomain ────────────────────────────────────────────────────

describe('ExpenseMapper.toDomain', () => {
  it('convierte un row Prisma completo a una Expense con Money VO correcto', () => {
    const raw = makePrismaExpense({
      accountId: 'account-1',
      categoryId: 'cat-1',
    });

    const expense = ExpenseMapper.toDomain(raw);

    expect(expense).toBeInstanceOf(Expense);
    expect(expense.id).toBe('exp-1');
    expect(expense.groupId).toBe('group-1');
    expect(expense.accountId).toBe('account-1');
    expect(expense.categoryId).toBe('cat-1');
    expect(expense.description).toBe('Supermercado');

    // Decimal('85.50') → number 85.5 vía Money VO
    expect(expense.amount.amount).toBe(85.5);
    expect(typeof expense.amount.amount).toBe('number');
    expect(expense.amount.currency).toBe('USD');

    expect(expense.source).toBe(ExpenseSource.CARD);
    expect(expense.status).toBe(ExpenseStatus.PENDING);
    expect(expense.month).toBe('03');
    expect(expense.year).toBe('2024');
    expect(expense.date).toEqual(new Date('2024-03-15'));
  });

  it('asigna assignments vacío cuando el campo está ausente (undefined)', () => {
    const raw = makePrismaExpense(); // sin campo assignments
    const expense = ExpenseMapper.toDomain(raw);
    expect(expense.assignments).toEqual([]);
  });

  it('asigna assignments vacío cuando el array está explícitamente vacío', () => {
    const raw = makePrismaExpense({ assignments: [] });
    const expense = ExpenseMapper.toDomain(raw);
    expect(expense.assignments).toEqual([]);
  });

  it('convierte assignments con Decimal percentage → Percentage VO con value numérico', () => {
    const raw = makePrismaExpense({
      assignments: [
        makePrismaAssignment({ id: 'a1', memberId: 'member-1', percentage: new Prisma.Decimal('60') }),
        makePrismaAssignment({ id: 'a2', memberId: 'member-2', percentage: new Prisma.Decimal('40') }),
      ],
    });

    const expense = ExpenseMapper.toDomain(raw);

    expect(expense.assignments).toHaveLength(2);
    expect(expense.assignments[0].memberId).toBe('member-1');
    expect(expense.assignments[0].percentage.value).toBe(60);
    expect(typeof expense.assignments[0].percentage.value).toBe('number');
    expect(expense.assignments[1].percentage.value).toBe(40);
  });

  it('mapea accountId / categoryId null → undefined en la entidad', () => {
    const expense = ExpenseMapper.toDomain(makePrismaExpense({ accountId: null, categoryId: null }));
    expect(expense.accountId).toBeUndefined();
    expect(expense.categoryId).toBeUndefined();
  });

  it('mapea importHash null → undefined en la entidad', () => {
    const expense = ExpenseMapper.toDomain(makePrismaExpense({ importHash: null }));
    expect(expense.importHash).toBeUndefined();
  });

  it('mapea importHash string → ImportHash VO con value correcto', () => {
    const expense = ExpenseMapper.toDomain(makePrismaExpense({ importHash: VALID_HASH }));
    expect(expense.importHash).toBeInstanceOf(ImportHash);
    expect(expense.importHash!.value).toBe(VALID_HASH);
  });

  it('usa Expense.reconstitute — NO emite domain events', () => {
    const expense = ExpenseMapper.toDomain(makePrismaExpense());
    // reconstitute no registra eventos; pullDomainEvents debe devolver []
    expect(expense.pullDomainEvents()).toHaveLength(0);
  });
});

// ── ExpenseMapper.toPrisma ────────────────────────────────────────────────────

describe('ExpenseMapper.toPrisma', () => {
  it('mapea la entidad a un objeto plano con amount como number (no Decimal)', () => {
    const data = ExpenseMapper.toPrisma(makeDomainExpense());

    expect(data.id).toBe('exp-1');
    expect(data.groupId).toBe('group-1');
    expect(data.description).toBe('Supermercado');
    expect(data.amount).toBe(85.5);
    expect(typeof data.amount).toBe('number');
    expect(data.currency).toBe('USD');
    expect(data.source).toBe('CARD');
    expect(data.status).toBe('PENDING');
    expect(data.month).toBe('03');
    expect(data.year).toBe('2024');
  });

  it('mapea campos opcionales ausentes a null', () => {
    const data = ExpenseMapper.toPrisma(makeDomainExpense());
    expect(data.accountId).toBeNull();
    expect(data.categoryId).toBeNull();
    expect(data.importHash).toBeNull();
    expect(data.importId).toBeNull();
  });

  it('mapea accountId y categoryId de la entidad cuando están presentes', () => {
    const expense = makeDomainExpense({ accountId: 'acc-1', categoryId: 'cat-1' });
    const data = ExpenseMapper.toPrisma(expense);
    expect(data.accountId).toBe('acc-1');
    expect(data.categoryId).toBe('cat-1');
  });

  it('mapea ImportHash VO → string hex en importHash', () => {
    const expense = makeDomainExpense({
      importHash: ImportHash.create(VALID_HASH),
      status: ExpenseStatus.IMPORTED,
    });
    const data = ExpenseMapper.toPrisma(expense);
    expect(data.importHash).toBe(VALID_HASH);
  });
});

// ── AssignmentMapper.toPrisma ─────────────────────────────────────────────────

describe('AssignmentMapper.toPrisma', () => {
  it('mapea Assignment al objeto plano esperado por Prisma', () => {
    const assignment = Assignment.create({
      id: 'asgn-1',
      expenseId: 'exp-1',
      memberId: 'member-1',
      percentage: Percentage.create(75),
    }).getOrThrow();

    const data = AssignmentMapper.toPrisma(assignment);

    expect(data.id).toBe('asgn-1');
    expect(data.expenseId).toBe('exp-1');
    expect(data.memberId).toBe('member-1');
    expect(data.percentage).toBe(75);
    expect(typeof data.percentage).toBe('number');
  });
});

// ── ExpenseAppMapper.toResponseDto ────────────────────────────────────────────

describe('ExpenseAppMapper.toResponseDto', () => {
  it('amount en el DTO es un number nativo — nunca un Decimal de Prisma', () => {
    // Simula el flujo real: Prisma Decimal → toDomain → toResponseDto
    const rawFromDb = makePrismaExpense({ amount: new Prisma.Decimal('123.45'), currency: 'EUR' });
    const domainExpense = ExpenseMapper.toDomain(rawFromDb);
    const dto = ExpenseAppMapper.toResponseDto(domainExpense);

    expect(dto.amount).toBe(123.45);
    expect(typeof dto.amount).toBe('number');
    expect(dto.currency).toBe('EUR');
  });

  it('assignments en el DTO son AssignmentResponseDto[] con percentage como number', () => {
    const rawFromDb = makePrismaExpense({
      status: 'ASSIGNED',
      assignments: [
        makePrismaAssignment({ id: 'a1', memberId: 'member-alice', percentage: new Prisma.Decimal('70') }),
        makePrismaAssignment({ id: 'a2', memberId: 'member-bob',   percentage: new Prisma.Decimal('30') }),
      ],
    });

    const dto = ExpenseAppMapper.toResponseDto(ExpenseMapper.toDomain(rawFromDb));

    expect(dto.assignments).toHaveLength(2);
    expect(dto.assignments[0]).toEqual({ id: 'a1', memberId: 'member-alice', percentage: 70 });
    expect(dto.assignments[1]).toEqual({ id: 'a2', memberId: 'member-bob',   percentage: 30 });
  });

  it('importHash en el DTO es string cuando está presente, undefined en caso contrario', () => {
    const withHash    = ExpenseMapper.toDomain(makePrismaExpense({ importHash: VALID_HASH }));
    const withoutHash = ExpenseMapper.toDomain(makePrismaExpense({ importHash: null }));

    expect(ExpenseAppMapper.toResponseDto(withHash).importHash).toBe(VALID_HASH);
    expect(ExpenseAppMapper.toResponseDto(withoutHash).importHash).toBeUndefined();
  });
});
