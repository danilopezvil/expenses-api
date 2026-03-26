import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface ImportHistoryDto {
  id: string;
  groupId: string;
  totalParsed: number;
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
  status: string;
  createdAt: Date;
}

@Injectable()
export class GetImportsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(groupId: string): Promise<ImportHistoryDto[]> {
    const imports = await this.prisma.import.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return imports.map((i) => ({
      id: i.id,
      groupId: i.groupId,
      totalParsed: i.totalParsed,
      totalInserted: i.totalInserted,
      totalSkipped: i.totalSkipped,
      totalErrors: i.totalErrors,
      status: i.status,
      createdAt: i.createdAt,
    }));
  }
}
