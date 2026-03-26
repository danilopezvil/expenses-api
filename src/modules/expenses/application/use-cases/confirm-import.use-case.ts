import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { Result, ok, err } from '@shared/result/result';
import { DomainError, ValidationError } from '@shared/errors/domain.errors';
import { Expense, ExpenseSource, ExpenseStatus } from '../../domain/entities/expense.entity';
import { ImportHash } from '../../domain/value-objects/import-hash.vo';
import { TextImportParserService, ParsedLine } from '../../domain/services/text-import-parser.service';
import { ExpenseImportedEvent } from '../../domain/events/expense-imported.event';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { IImportsRepository } from '../../domain/ports/imports-repository.port';
import { EXPENSE_REPOSITORY_PORT, IMPORTS_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { ConfirmImportAppDto } from '../dtos/app-commands.dto';
import { ConfirmImportResultDto } from '../dtos/app-responses.dto';

@Injectable()
export class ConfirmImportUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
    @Inject(IMPORTS_REPOSITORY_PORT)
    private readonly importsRepo: IImportsRepository,
    private readonly parser: TextImportParserService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: ConfirmImportAppDto): Promise<Result<ConfirmImportResultDto, DomainError>> {
    const { parsed, errors } = this.parser.parse(dto.rawText, dto.groupId, dto.year);

    // Filter duplicates when requested
    let lines: ParsedLine[] = parsed;
    let skipped = 0;
    if (dto.skipDuplicates) {
      const results = await Promise.all(
        parsed.map(async (line) => {
          const existing = await this.expenseRepo.findByHash(line.hash);
          return existing ? null : line;
        }),
      );
      lines = results.filter((l): l is ParsedLine => l !== null);
      skipped = parsed.length - lines.length;
    }

    // Build Expense entities (skip lines that fail domain validation)
    const expenses: Expense[] = [];
    for (const line of lines) {
      const result = Expense.create({
        id: randomUUID(),
        groupId: dto.groupId,
        description: line.description,
        amount: line.amount,
        source: ExpenseSource.CARD,
        status: ExpenseStatus.IMPORTED,
        importHash: line.hash,
        date: line.date,
      });
      if (result.isOk()) expenses.push(result.value);
    }

    if (expenses.length === 0 && lines.length > 0) {
      return err(new ValidationError('All lines failed domain validation'));
    }

    const totalAmount = Math.round(
      expenses.reduce((sum, e) => sum + e.amount.amount, 0) * 100,
    ) / 100;

    // Persist in a single transaction via saveMany
    await this.expenseRepo.saveMany(expenses);

    // Record the import
    await this.importsRepo.save({
      groupId: dto.groupId,
      year: dto.year,
      count: expenses.length,
      totalAmount,
      currency: dto.currency ?? 'USD',
    });

    // Publish per-expense created events + one batch imported event
    for (const expense of expenses) {
      for (const event of expense.pullDomainEvents()) this.eventBus.publish(event);
    }
    // ExpenseImportedEvent requires importHash — all IMPORTED expenses have it
    type WithHash = Expense & { importHash: ImportHash };
    const withHash = expenses.filter((e): e is WithHash => e.importHash !== undefined);
    if (withHash.length > 0) {
      this.eventBus.publish(new ExpenseImportedEvent(withHash));
    }

    return ok({
      imported: expenses.length,
      skipped,
      parseErrors: errors.length,
      totalAmount,
    });
  }
}
