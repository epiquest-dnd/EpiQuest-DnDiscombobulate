import type { Credentials, User } from './users.types.ts';

export interface UserRepository {
  insert(user: User, passwordHash: string): Promise<void>;
  findById(id: string): Promise<User | null>;
  findCredentialsByEmail(email: string): Promise<Credentials | null>;
}
