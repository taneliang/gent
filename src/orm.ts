import { EntityManager, MikroORM, Options } from "mikro-orm";

let globalOrm: MikroORM | undefined;

export async function initOrm(options: Options): Promise<void> {
  globalOrm = await MikroORM.init(options);
}

class OrmNotInitializedError extends Error {
  constructor() {
    super(
      "ORM not initialized! Ensure that `initOrm` was called and the promise resolved."
    );
  }
}

function initializedGlobalOrm(): MikroORM | never {
  if (!globalOrm) {
    throw new OrmNotInitializedError();
  }
  return globalOrm;
}

export function getGlobalEntityManager(): EntityManager {
  return initializedGlobalOrm().em;
}

export function createContextualizedEntityManager(): EntityManager {
  return initializedGlobalOrm().em.fork();
}

export async function closeGlobalOrmConnection(
  force: boolean | undefined = undefined
): Promise<void> {
  if (globalOrm) {
    return globalOrm.close(force);
  }
}
