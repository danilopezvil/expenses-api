import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';
import { UpdateGroupAppDto, GroupDto } from '../dtos/groups-app.dto';

@Injectable()
export class UpdateGroupUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: UpdateGroupAppDto): Promise<Result<GroupDto, NotFoundError>> {
    const existing = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!existing) return err(new NotFoundError('Group not found'));

    const group = await this.prisma.group.update({
      where: { id: dto.groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
    });

    return ok({
      id: group.id,
      name: group.name,
      description: group.description ?? undefined,
      currency: group.currency,
      active: group.active,
      createdAt: group.createdAt,
    });
  }
}
