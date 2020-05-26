export class AccessControlPoliceReuseError extends Error {
  constructor() {
    super("An instance of AccessControlPolice cannot enforce more than once.");
  }
}
