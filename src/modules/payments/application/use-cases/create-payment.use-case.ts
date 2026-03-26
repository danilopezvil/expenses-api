import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError, ValidationError } from '@shared/errors/domain.errors';
import { PaymentDto } from '../queries/get-payments.query';

export interface CreatePaymentAppDto {
  groupId: string;
  memberId: string;
  month: string;
  year: string;
  amount: number;
  note?: string;
}

@Injectable()
export class CreatePaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreatePaymentAppDto): Promise<Result<PaymentDto, NotFoundError | ValidationError>> {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, groupId: dto.groupId, active: true },
    });
    if (!member) return err(new NotFoundError('Member not found in this group'));

    if (dto.amount <= 0) return err(new ValidationError('Payment amount must be positive'));

    const payment = await this.prisma.payment.create({
      data: {
        id: randomUUID(),
        groupId: dto.groupId,
        memberId: dto.memberId,
        month: dto.month,
        year: dto.year,
        amount: dto.amount,
        note: dto.note,
      },
    });

    return ok({
      id: payment.id,
      groupId: payment.groupId,
      memberId: payment.memberId,
      month: payment.month,
      year: payment.year,
      amount: Number(payment.amount),
      note: payment.note ?? undefined,
      paidAt: payment.paidAt,
    });
  }
}
