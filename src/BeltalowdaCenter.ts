import { EntityName } from "mikro-orm";
import { GentModel } from "./GentModel";
import { Beltalowda } from "./Beltalowda";

/**
 * Maintains a map of models and fields to Beltalowda instances. Allows
 * separate GentLoader instances to batch similar queries without knowing about
 * each other.
 *
 * Should be scoped to a single ViewerContext so that cached values are not
 * inadvertently shared.
 *
 * Internal class, not intended for use outside Gent and Gent-generated code.
 */
export class BeltalowdaCenter {
  /**
   * #loaders[model name][field name to load] -> beltalowda object
   */
  readonly #loaders = new Map<string, Map<string, unknown>>();

  beltalowdaForModel<M extends GentModel, FT extends string | number>(
    entityClass: EntityName<M>,
    fieldNameToFilter: string,
    loaderProvider: () => Beltalowda<M, FT>
  ): Beltalowda<M, FT> {
    const modelName =
      typeof entityClass === "string"
        ? entityClass
        : entityClass.prototype.constructor.name;
    const existingLoadersForModel = this.#loaders.get(modelName);
    if (!existingLoadersForModel) {
      this.#loaders.set(modelName, new Map());
    }

    // `get` guaranteed to succeed due to the above check and `set`.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const loadersForModel = this.#loaders.get(modelName)!;

    const existingLoader = loadersForModel.get(fieldNameToFilter);
    if (existingLoader) {
      return existingLoader as Beltalowda<M, FT>;
    }

    const newLoader = loaderProvider();
    loadersForModel.set(fieldNameToFilter, newLoader);
    return newLoader;
  }
}
