export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  currency: string;
  active: boolean;
  createdAt: Date;
}

export interface GroupListItemDto extends GroupDto {
  role: string;
  memberCount: number;
  joinedAt: Date;
}

export interface CreateGroupAppDto {
  name: string;
  description?: string;
  currency?: string;
  userId: string;
}

export interface UpdateGroupAppDto {
  groupId: string;
  name?: string;
  description?: string;
  currency?: string;
}
