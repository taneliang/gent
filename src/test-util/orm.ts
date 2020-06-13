import { EntityManager, MikroORM } from "mikro-orm";
import { TestEntity } from "./TestEntity";

let globalOrm: MikroORM | undefined;

export async function initTestOrm(): Promise<void> {
  globalOrm = await MikroORM.init({
    debug: true,
    dbName: "/tmp/genttests.sqlite",
    type: "sqlite",
    entities: [TestEntity],
  });
}

class OrmNotInitializedError extends Error {
  constructor() {
    super(
      "ORM not initialized! Ensure that `initTestOrm` was called and the promise resolved."
    );
  }
}

function initializedGlobalOrm(): MikroORM | never {
  if (!globalOrm) {
    throw new OrmNotInitializedError();
  }
  return globalOrm;
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
