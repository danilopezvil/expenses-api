import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export { AuditAction };

export interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  request?: Request;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          before: params.before !== undefined ? (params.before as object) : undefined,
          after: params.after !== undefined ? (params.after as object) : undefined,
          ipAddress: params.ipAddress ?? params.request?.ip ?? null,
          userAgent: params.request?.headers['user-agent'] ?? null,
        },
      });
    } catch (error) {
      this.logger.error({ err: error }, 'AuditService: failed to write audit log');
    }
  }
}
