export interface AccountInfo {
  id: string;
  groupId: string;
  name: string;
  /** Which group member "owns" this account (used for reconciliation). */
  memberId?: string;
}

export interface IAccountRepository {
  findById(id: string): Promise<AccountInfo | null>;
  findByGroupId(groupId: string): Promise<AccountInfo[]>;
}
