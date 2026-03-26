import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class DeletePaymentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(paymentId: string, groupId: string): Promise<Result<void, NotFoundError>> {
    const existing = await this.prisma.payment.findFirst({
      where: { id: paymentId, groupId },
    });
    if (!existing) return err(new NotFoundError('Payment not found'));

    await this.prisma.payment.delete({ where: { id: paymentId } });
    return ok(undefined);
  }
}
