import { Injectable, Inject } from '@nestjs/common';
import { TextImportParserService } from '../../domain/services/text-import-parser.service';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { EXPENSE_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { PreviewImportAppDto } from '../dtos/app-commands.dto';
import { PreviewImportResponseDto } from '../dtos/app-responses.dto';

@Injectable()
export class PreviewImportUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
    private readonly parser: TextImportParserService,
  ) {}

  async execute(dto: PreviewImportAppDto): Promise<PreviewImportResponseDto> {
    const { parsed, errors } = this.parser.parse(dto.rawText, dto.groupId, dto.year);

    // Check each parsed line against the repo (duplicate detection by hash)
    const parsedWithDuplicate = await Promise.all(
      parsed.map(async (line) => {
        const existing = await this.expenseRepo.findByHash(line.hash);
        return { ...line, isDuplicate: existing !== null };
      }),
    );

    const currency = dto.currency ?? 'USD';
    const nonDuplicates = parsedWithDuplicate.filter((p) => !p.isDuplicate);
    const totalAmount = Math.round(
      nonDuplicates.reduce((sum, p) => sum + p.amount.amount, 0) * 100,
    ) / 100;

    return {
      parsed: parsedWithDuplicate.map((p) => ({
        date: p.date,
        description: p.description,
        amount: p.amount.amount,
        currency: p.amount.currency,
        hash: p.hash.value,
        isDuplicate: p.isDuplicate,
      })),
      parseErrors: errors,
      totalAmount,
      currency,
      count: parsedWithDuplicate.length,
      duplicateCount: parsedWithDuplicate.filter((p) => p.isDuplicate).length,
    };
  }
}
