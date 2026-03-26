export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  active: boolean;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: CreateUserData): Promise<UserRecord>;
}
