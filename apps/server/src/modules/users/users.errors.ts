export class EmailTakenError extends Error {
  constructor() {
    super('Email already taken');
    this.name = 'EmailTakenError';
  }
}
