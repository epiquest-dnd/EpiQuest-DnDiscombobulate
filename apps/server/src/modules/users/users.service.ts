import { v7 } from 'uuid';
import type { UserRepository } from './user.repository.ts';
import type { CreateUserInput, Credentials, User } from './users.types.ts';

const DEFAULT_LOCALE = 'en';

export class UsersService {
  private readonly userRepository: UserRepository;
  private readonly now: () => Date;

  constructor(userRepository: UserRepository, now: () => Date = () => new Date()) {
    this.userRepository = userRepository;
    this.now = now;
  }

  async createWithPassword(input: CreateUserInput, passwordHash: string): Promise<User> {
    const createdAt = this.now();
    const user: User = {
      id: v7(),
      role: 'user',
      email: input.email,
      displayName: input.displayName,
      locale: input.locale ?? DEFAULT_LOCALE,
      preferences: {},
      createdAt,
      updatedAt: createdAt,
    };
    await this.userRepository.insert(user, passwordHash);
    return user;
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  findCredentialsByEmail(email: string): Promise<Credentials | null> {
    return this.userRepository.findCredentialsByEmail(email);
  }
}
