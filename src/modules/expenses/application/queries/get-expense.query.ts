import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ExpenseMapper } from '../../infrastructure/mappers/expense.mapper';
import { ExpenseAppMapper } from '../mappers/expense-app.mapper';
import { ExpenseResponseDto } from '../dtos/app-responses.dto';

@Injectable()
export class GetExpenseQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(expenseId: string, groupId: string): Promise<ExpenseResponseDto | null> {
    const raw = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { assignments: true },
    });
    if (!raw || raw.groupId !== groupId) return null;
    return ExpenseAppMapper.toResponseDto(ExpenseMapper.toDomain(raw));
  }
}
