export interface MemberDto {
  id: string;
  groupId: string;
  userId?: string;
  name: string;
  color: string;
  active: boolean;
  createdAt: Date;
}

export interface CreateMemberAppDto {
  groupId: string;
  name: string;
  color?: string;
  userId?: string;
}

export interface UpdateMemberAppDto {
  memberId: string;
  groupId: string;
  name?: string;
  color?: string;
}
