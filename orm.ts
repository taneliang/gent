import { AnyEntity, EntitySchema, MikroORM } from 'mikro-orm';
import { EntityClass, EntityClassGroup } from 'mikro-orm/dist/typings';
import { BaseGent } from './BaseGent';

let globalOrm: MikroORM | undefined;

export async function initOrm(
  entities: (EntityClass<AnyEntity> | EntityClassGroup<AnyEntity> | EntitySchema<any>)[],
  otherOptions: Omit<ConstructorParameters<typeof MikroORM>[0], 'entities'>,
) {
  const options: Omit<ConstructorParameters<typeof MikroORM>[0], 'entities'> = {
    ...otherOptions,
    // Inject Gent entities
    entities: [...entities, BaseGent],
  };
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
