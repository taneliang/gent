export class PoliceReuseError extends Error {
  constructor() {
    super('An instance of Police cannot enforce more than once.');
  }
}
