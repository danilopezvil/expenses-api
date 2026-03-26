import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok } from '@shared/result/result';
import { ExportDto } from '../queries/get-exports.query';

export interface CreateExportAppDto {
  groupId: string;
  filters: {
    month?: string;
    year?: string;
    status?: string;
  };
}

@Injectable()
export class CreateExportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateExportAppDto): Promise<Result<ExportDto, never>> {
    const record = await this.prisma.export.create({
      data: {
        id: randomUUID(),
        groupId: dto.groupId,
        filters: dto.filters,
        status: 'COMPLETED',
      },
    });

    return ok({
      id: record.id,
      groupId: record.groupId,
      filters: record.filters,
      fileSize: record.fileSize ?? undefined,
      status: record.status,
      createdAt: record.createdAt,
    });
  }
}
