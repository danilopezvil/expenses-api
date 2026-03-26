import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { IImportsRepository, ImportRecord } from '../../domain/ports/imports-repository.port';

@Injectable()
export class ImportsPrismaRepository implements IImportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(record: Omit<ImportRecord, 'id' | 'importedAt'>): Promise<ImportRecord> {
    const created = await this.prisma.import.create({
      data: {
        groupId: record.groupId,
        rawText: '',            // raw text not available at this call site
        totalParsed: record.count,
        totalInserted: record.count,
        totalSkipped: 0,
        totalErrors: 0,
        status: 'COMPLETED',
      },
    });

    return {
      id: created.id,
      groupId: created.groupId,
      year: record.year,         // year stored only in memory (no column in Import table)
      count: created.totalInserted,
      totalAmount: record.totalAmount,
      currency: record.currency,
      importedAt: created.createdAt,
    };
  }
}
