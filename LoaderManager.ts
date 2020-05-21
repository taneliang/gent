import Dataloader from 'dataloader';
import { EntityName } from 'mikro-orm';
import { BaseGent } from './BaseGent';
import { GentBeltalowda } from './GentLoader';

export type GentDataloader = Dataloader<number, unknown>;

/**
 * Maintains a map of queries to Dataloaders. Allows GentLoader instances to
 * batch queries with identical SQL.
 *
 * Should be scoped to a single ViewerContext so that cached values are not
 * inadvertently shared.
 *
 * Internal class, not intended for use outside Gent.
 */
export class DataloaderCenter {
  readonly #loaders = new Map<string, unknown>();

  beltalowdaForModel<
    L extends GentBeltalowda<M>,
    M extends BaseGent = L extends GentBeltalowda<infer T> ? T : never
  >(entityClass: EntityName<M>, loaderProvider: () => L): L {
    const loaderKey =
      typeof entityClass === 'string' ? entityClass : entityClass.prototype.constructor.name;
    const existingLoader = this.#loaders.get(loaderKey);
    if (existingLoader) {
      return existingLoader as L;
    }

    const newLoader = loaderProvider();
    this.#loaders.set(loaderKey, newLoader);
    return newLoader;
  }
}
