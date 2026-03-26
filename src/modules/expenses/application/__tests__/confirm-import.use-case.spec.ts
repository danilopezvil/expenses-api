import { EventBus } from '@nestjs/cqrs';
import { ConfirmImportUseCase } from '../use-cases/confirm-import.use-case';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { IImportsRepository } from '../../domain/ports/imports-repository.port';
import { TextImportParserService } from '../../domain/services/text-import-parser.service';
import { ImportHash } from '../../domain/value-objects/import-hash.vo';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { Money } from '../../domain/value-objects/money.vo';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeRepo(): jest.Mocked<IExpenseRepository> {
  return {
    findById: jest.fn(),
    findByGroupId: jest.fn(),
    findByHash: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    saveMany: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    replaceWithGrouped: jest.fn().mockResolvedValue(undefined),
  };
}

function makeImportsRepo(): jest.Mocked<IImportsRepository> {
  return {
    save: jest.fn().mockResolvedValue({ id: 'import-1', importedAt: new Date() }),
  };
}

function makeExistingExpense(): Expense {
  return Expense.reconstitute({
    id: 'existing-1',
    groupId: 'group-1',
    description: 'Supermercado',
    amount: Money.create(85.5, 'USD'),
    source: ExpenseSource.CARD,
    status: ExpenseStatus.IMPORTED,
    importHash: ImportHash.fromRaw('15/03', 'Supermercado', '85.5', 'group-1'),
    date: new Date('2024-03-15'),
    month: '03',
    year: '2024',
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const VALID_TWO_LINES = '15/03 | Supermercado | 85.50\n20/03 | Gasolina | 60.00';
const GROUP_ID = 'group-1';
const YEAR = 2024;

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ConfirmImportUseCase', () => {
  let useCase: ConfirmImportUseCase;
  let repo: jest.Mocked<IExpenseRepository>;
  let importsRepo: jest.Mocked<IImportsRepository>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;

  beforeEach(() => {
    repo = makeRepo();
    importsRepo = makeImportsRepo();
    eventBus = { publish: jest.fn() };
    useCase = new ConfirmImportUseCase(
      repo,
      importsRepo,
      new TextImportParserService(),
      eventBus as unknown as EventBus,
    );
  });

  it('imports all valid lines and returns correct counts', async () => {
    const result = await useCase.execute({ groupId: GROUP_ID, rawText: VALID_TWO_LINES, year: YEAR });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.imported).toBe(2);
    expect(result.value.skipped).toBe(0);
    expect(result.value.parseErrors).toBe(0);
    expect(repo.saveMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ source: ExpenseSource.CARD, status: ExpenseStatus.IMPORTED }),
    ]));
  });

  it('skips duplicates when skipDuplicates=true', async () => {
    // Parser normalises "85.50" → '85.50' (not '85.5') before hashing
    const existingHash = ImportHash.fromRaw('15/03', 'Supermercado', '85.50', GROUP_ID);
    repo.findByHash.mockImplementation(async (hash: ImportHash) =>
      hash.value === existingHash.value ? makeExistingExpense() : null,
    );

    const result = await useCase.execute({
      groupId: GROUP_ID,
      rawText: VALID_TWO_LINES,
      year: YEAR,
      skipDuplicates: true,
    });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.imported).toBe(1);
    expect(result.value.skipped).toBe(1);
  });

  it('does NOT skip duplicates when skipDuplicates is omitted (default)', async () => {
    repo.findByHash.mockResolvedValue(makeExistingExpense()); // all are "duplicates" in repo

    const result = await useCase.execute({
      groupId: GROUP_ID,
      rawText: VALID_TWO_LINES,
      year: YEAR,
      // skipDuplicates not set
    });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.imported).toBe(2); // all imported regardless
  });

  it('processes only valid lines — parse errors go to parseErrors count', async () => {
    const mixedText = '15/03 | Supermercado | 50.00\nBAD LINE WITHOUT PIPES';

    const result = await useCase.execute({ groupId: GROUP_ID, rawText: mixedText, year: YEAR });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.imported).toBe(1);
    expect(result.value.parseErrors).toBe(1);
  });

  it('handles comma decimal separator correctly', async () => {
    const commaText = '15/03 | Café | 12,50';

    const result = await useCase.execute({ groupId: GROUP_ID, rawText: commaText, year: YEAR });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.imported).toBe(1);
    expect(result.value.totalAmount).toBe(12.5);
  });

  it('saves an import record via importsRepo', async () => {
    await useCase.execute({ groupId: GROUP_ID, rawText: VALID_TWO_LINES, year: YEAR });

    expect(importsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: GROUP_ID, year: YEAR, count: 2 }),
    );
  });

  it('publishes events for each imported expense', async () => {
    await useCase.execute({ groupId: GROUP_ID, rawText: VALID_TWO_LINES, year: YEAR });

    // 2 ExpenseCreatedEvents + 1 ExpenseImportedEvent (batch)
    expect(eventBus.publish).toHaveBeenCalledTimes(3);
  });

  it('returns totalAmount as sum of imported expense amounts', async () => {
    const result = await useCase.execute({ groupId: GROUP_ID, rawText: VALID_TWO_LINES, year: YEAR });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) throw new Error('narrowing');
    expect(result.value.totalAmount).toBe(145.5);
  });
});
