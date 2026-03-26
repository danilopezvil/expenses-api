// NOTE: Requires Prisma migration — uses Assignment table and new Expense fields.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetDashboardFiltersDto, DashboardDto } from '../dtos/app-responses.dto';

@Injectable()
export class GetDashboardQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: GetDashboardFiltersDto): Promise<DashboardDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      groupId: filters.groupId,
      // status: { not: 'VOIDED' },  // TODO: enable after migration
    };
    if (filters.month) where['month'] = filters.month;
    if (filters.year) where['year'] = filters.year;

    const [expenses, aggregate] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: { splits: true },
        orderBy: { amount: 'desc' },
        take: 5,
      }),
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalAmount = Number(aggregate._sum.amount ?? 0);
    const totalExpenses = aggregate._count.id;
    const currency = expenses[0]?.currency ?? 'USD';

    // TODO: byMember and byCategory require the Assignment table (post-migration)
    // For now return totals only — full aggregation available after schema migration
    const byAccount = await this.prisma.expense
      .groupBy({
        by: ['groupId'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      })
      .then((rows) =>
        rows.map((r) => ({
          accountId: r.groupId ?? '',
          name: r.groupId ?? '',
          total: Number(r._sum.amount ?? 0),
          currency,
        })),
      );

    const unassigned = await this.prisma.expense.count({
      where: { ...where, splits: { none: {} } },
    });

    return {
      totalExpenses,
      totalAmount,
      currency,
      byMember: [], // TODO: post-migration (needs Assignment table)
      byCategory: [], // TODO: post-migration (needs categoryId field)
      byAccount,
      unassigned,
      topExpenses: expenses.map((e) => ({
        id: e.id,
        description: e.title,
        amount: Number(e.amount),
        currency: e.currency,
        date: e.createdAt,
      })),
    };
  }
}
