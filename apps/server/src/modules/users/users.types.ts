export type UserRole = 'admin' | 'user';

export type User = {
  id: string;
  role: UserRole;
  email: string;
  displayName: string;
  locale: string;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  email: string;
  displayName: string;
  locale?: string;
};

export type Credentials = {
  userId: string;
  passwordHash: string;
};
