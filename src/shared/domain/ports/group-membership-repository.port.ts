import { GroupRole } from '@prisma/client';

export { GroupRole };

export interface GroupMembershipRecord {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  active: boolean;
  joinedAt: Date;
}

export interface IGroupMembershipRepository {
  findActiveByUserAndGroup(userId: string, groupId: string): Promise<GroupMembershipRecord | null>;
}

export const GROUP_MEMBERSHIP_REPOSITORY_PORT = Symbol('IGroupMembershipRepository');
