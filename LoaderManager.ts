import Dataloader from 'dataloader';
import { EntityName } from 'mikro-orm';
import { BaseGent } from './entities/BaseGent';
import { GentBeltalowda } from './GentBeltalowda';

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
  /**
   * #loaders[model name][field name to load] -> beltalowda object
   */
  readonly #loaders = new Map<string, Map<string, unknown>>();

  beltalowdaForModel<
    L extends GentBeltalowda<M, FT>,
    M extends BaseGent,
    FT extends string | number = L extends GentBeltalowda<M, infer T> ? T : never
  >(entityClass: EntityName<M>, fieldNameToFilter: string, loaderProvider: () => L): L {
    const modelName =
      typeof entityClass === 'string' ? entityClass : entityClass.prototype.constructor.name;
    const existingLoadersForModel = this.#loaders.get(modelName);
    if (!existingLoadersForModel) {
      this.#loaders.set(modelName, new Map());
    }
    const loadersForModel = this.#loaders.get(modelName)!;

    const existingLoader = loadersForModel.get(fieldNameToFilter);
    if (existingLoader) {
      return existingLoader as L;
    }

    const newLoader = loaderProvider();
    loadersForModel.set(fieldNameToFilter, newLoader);
    return newLoader;
  }
}
