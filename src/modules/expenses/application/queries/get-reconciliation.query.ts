// NOTE: Full reconciliation requires the Assignment table (post-migration).
// Current stub computes balance from group members + expense amounts.
// Electron logic (lines 241-252): balance = totalPaid - totalAssigned; status from sign.
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
    const expenseWhere: Record<string, any> = { groupId: filters.groupId };
    if (filters.month) expenseWhere['month'] = filters.month;
    if (filters.year) expenseWhere['year'] = filters.year;

    // Fetch members of the group
    const members = await this.prisma.groupMember.findMany({
      where: { groupId: filters.groupId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Fetch all non-voided expenses with their splits (assignments post-migration)
    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      include: { splits: true },
    });

    // Build per-member totals
    // totalAssigned: sum of split amounts assigned to each user
    // totalPaid: not yet modelled — requires accountId→memberId link (post-migration)
    // For now totalPaid defaults to 0 for all members (placeholder)
    const assigned = new Map<string, number>();
    for (const expense of expenses) {
      for (const split of expense.splits) {
        const current = assigned.get(split.userId) ?? 0;
        assigned.set(split.userId, current + Number(split.amount));
      }
    }

    const BALANCE_EPSILON = 0.01;

    return members.map((m): ReconciliationItemDto => {
      const totalAssigned = Math.round((assigned.get(m.userId) ?? 0) * 100) / 100;
      const totalPaid = 0; // TODO: derive from account ownership after migration
      const balance = Math.round((totalPaid - totalAssigned) * 100) / 100;

      let status: ReconciliationStatus;
      if (Math.abs(balance) <= BALANCE_EPSILON) status = 'SETTLED';
      else if (balance < 0) status = 'OWES';
      else status = 'OWED';

      return {
        memberId: m.userId,
        name: m.user.name,
        color: memberColor(m.userId),
        totalAssigned,
        totalPaid,
        balance,
        status,
      };
    });
  }
}

/** Deterministic HSL color derived from memberId — replaced by DB value post-migration. */
function memberColor(id: string): string {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 65%, 55%)`;
}
