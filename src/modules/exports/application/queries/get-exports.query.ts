import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface ExportDto {
  id: string;
  groupId: string;
  filters: unknown;
  fileSize?: number;
  status: string;
  createdAt: Date;
}

@Injectable()
export class GetExportsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(groupId: string): Promise<ExportDto[]> {
    const exports = await this.prisma.export.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return exports.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      filters: e.filters,
      fileSize: e.fileSize ?? undefined,
      status: e.status,
      createdAt: e.createdAt,
    }));
  }
}
