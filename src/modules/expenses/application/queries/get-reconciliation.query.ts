import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  GetReconciliationFiltersDto,
  ReconciliationItemDto,
  ReconciliationStatus,
} from '../dtos/app-responses.dto';

@Injectable()
export class GetReconciliationQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: GetReconciliationFiltersDto): Promise<ReconciliationItemDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expenseWhere: Record<string, any> = {
      groupId: filters.groupId,
      NOT: { status: 'VOIDED' },
    };
    if (filters.month) expenseWhere['month'] = filters.month;
    if (filters.year) expenseWhere['year'] = filters.year;

    // Financial members of the group (may not have a User account)
    const members = await this.prisma.member.findMany({
      where: { groupId: filters.groupId, active: true },
    });

    // Expenses with their percentage-based assignments
    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      include: { assignments: true },
    });

    // totalAssigned per member = Σ (expense.amount × assignment.percentage / 100)
    const assigned = new Map<string, number>();
    for (const expense of expenses) {
      const amount = Number(expense.amount);
      for (const a of expense.assignments) {
        const memberAmount = (amount * Number(a.percentage)) / 100;
        assigned.set(a.memberId, (assigned.get(a.memberId) ?? 0) + memberAmount);
      }
    }

    const BALANCE_EPSILON = 0.01;

    return members.map((m): ReconciliationItemDto => {
      const totalAssigned = Math.round((assigned.get(m.id) ?? 0) * 100) / 100;
      const totalPaid = 0; // TODO: derive from account ownership after migration
      const balance = Math.round((totalPaid - totalAssigned) * 100) / 100;

      let status: ReconciliationStatus;
      if (Math.abs(balance) <= BALANCE_EPSILON) status = 'SETTLED';
      else if (balance < 0) status = 'OWES';
      else status = 'OWED';

      return {
        memberId: m.id,
        name: m.name,
        color: m.color,
        totalAssigned,
        totalPaid,
        balance,
        status,
      };
    });
  }
}
