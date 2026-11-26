export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super('Password does not meet the requirements');
    this.name = 'WeakPasswordError';
  }
}
