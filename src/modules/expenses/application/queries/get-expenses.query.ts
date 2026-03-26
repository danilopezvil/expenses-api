// NOTE: This query reads directly from Prisma (CQRS read model).
// Requires Prisma migration that adds: source, status, importHash, date, month, year to Expense
// and creates the Assignment table.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  GetExpensesFiltersDto,
  ExpenseListItemDto,
  PaginationMeta,
} from '../dtos/app-responses.dto';

@Injectable()
export class GetExpensesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: GetExpensesFiltersDto): Promise<{
    data: ExpenseListItemDto[];
    meta: PaginationMeta;
  }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { groupId: filters.groupId };
    if (filters.month) where['month'] = filters.month;
    if (filters.year) where['year'] = filters.year;
    if (filters.accountId) where['accountId'] = filters.accountId;
    if (filters.categoryId) where['categoryId'] = filters.categoryId;
    if (filters.status) where['status'] = filters.status;
    if (filters.search) {
      where['description'] = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.assigned === true) where['assignments'] = { some: {} };
    if (filters.assigned === false) where['assignments'] = { none: {} };

    const [raws, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { splits: true } } },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: raws.map((r) => ({
        id: r.id,
        groupId: r.groupId ?? '',
        accountId: r.groupId ?? undefined, // TODO: map accountId after migration
        categoryId: r.category ?? undefined,
        description: r.title,
        amount: Number(r.amount),
        currency: r.currency,
        source: 'MANUAL' as ExpenseListItemDto['source'], // TODO: map after migration
        status: 'PENDING' as ExpenseListItemDto['status'], // TODO: map after migration
        date: r.createdAt,
        month: String(r.createdAt.getMonth() + 1).padStart(2, '0'),
        year: String(r.createdAt.getFullYear()),
        assignmentCount: r._count.splits,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
