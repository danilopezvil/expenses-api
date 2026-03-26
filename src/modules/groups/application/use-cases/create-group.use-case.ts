import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok } from '@shared/result/result';
import { CreateGroupAppDto, GroupDto } from '../dtos/groups-app.dto';

@Injectable()
export class CreateGroupUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateGroupAppDto): Promise<Result<GroupDto, never>> {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        currency: dto.currency ?? 'USD',
        memberships: {
          create: { userId: dto.userId, role: 'GROUP_ADMIN' },
        },
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
