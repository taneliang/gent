import gentOptions from "./mikro-orm.config";
import { EntityManager, MikroORM } from "mikro-orm";

let globalOrm: MikroORM | undefined;

export async function initOrm(): Promise<void> {
  globalOrm = await MikroORM.init(gentOptions);
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

export function createEntityManagerForNewVC(): EntityManager {
  return initializedGlobalOrm().em.fork();
}

export async function closeGlobalOrmConnection(
  force: boolean | undefined = undefined
): Promise<void> {
  if (globalOrm) {
    return globalOrm.close(force);
  }
}
