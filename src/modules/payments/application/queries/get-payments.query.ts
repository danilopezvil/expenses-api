import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface PaymentDto {
  id: string;
  groupId: string;
  memberId: string;
  month: string;
  year: string;
  amount: number;
  note?: string;
  paidAt: Date;
}

@Injectable()
export class GetPaymentsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(groupId: string, filters: { month?: string; year?: string }): Promise<PaymentDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { groupId };
    if (filters.month) where['month'] = filters.month;
    if (filters.year) where['year'] = filters.year;

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      groupId: p.groupId,
      memberId: p.memberId,
      month: p.month,
      year: p.year,
      amount: Number(p.amount),
      note: p.note ?? undefined,
      paidAt: p.paidAt,
    }));
  }
}
