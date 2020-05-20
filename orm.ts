import { MikroORM, Options } from 'mikro-orm';
import { BaseGent } from './BaseGent';

let globalOrm: MikroORM | undefined;

export const gentEntities = [BaseGent];

export async function initOrm(options: Options) {
  globalOrm = await MikroORM.init(options);
}

class OrmNotInitializedError extends Error {
  constructor() {
    super('ORM not initialized! Ensure that `initOrm` was called and the promise resolved.');
  }
}

function initializedGlobalOrm(): MikroORM | never {
  if (!globalOrm) {
    throw new OrmNotInitializedError();
  }
  return globalOrm;
}

export function getGlobalEntityManager() {
  return initializedGlobalOrm().em;
}

export function createContextualizedEntityManager() {
  return initializedGlobalOrm().em.fork();
}
