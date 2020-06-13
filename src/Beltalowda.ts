import Dataloader from "dataloader";
import _ from "lodash";
import { ViewerContext } from ".";
import { GentModel } from "./GentModel";
import { GentQuery } from "./GentQuery";

/**
 * The internal underlying layer below the user-facing `GentLoader`. It gathers
 * values to be loaded for one field and loads them in a batch. Enforces access
 * control rules by running all batched queries using `GentQuery`.
 *
 * To be used through subclasses generated for an entity.
 */
// Named after the inhabitants of the Belt in the awesome TV show The Expanse.
// The belters (who call themselves beltalowda) tend to be a lower class in
// interplanatary human civilization, performing unsafe tasks like mining for
// the inner planets. The name is fitting for this class as it does GentLoader's
// dirty work. See: https://expanse.fandom.com/wiki/Beltalowda
export class Beltalowda<
  Model extends GentModel,
  FieldType extends string | number
> {
  readonly vc: ViewerContext;
  readonly queryConstructor: () => GentQuery<Model>;
  readonly fieldNameToFilter: string;
  readonly mapEntityToKey: (entity: Model) => FieldType;

  private readonly dataloader: Dataloader<FieldType, Model[] | undefined>;

  constructor(
    vc: ViewerContext,
    queryConstructor: () => GentQuery<Model>,
    fieldNameToFilter: string,
    mapEntityToKey: (entity: Model) => FieldType
  ) {
    this.vc = vc;
    this.queryConstructor = queryConstructor;
    this.fieldNameToFilter = fieldNameToFilter;
    this.mapEntityToKey = mapEntityToKey;
    this.dataloader = new Dataloader(this.#batchLoadFunction);
  }

  readonly #batchLoadFunction: Dataloader.BatchLoadFn<
    FieldType,
    Model[]
  > = async (valuesToFetch) => {
    const unorderedResults = await this.queryConstructor()
      .dangerouslyBuildKnexQueryBuilder((qb) =>
        qb.whereIn(this.fieldNameToFilter, valuesToFetch)
      )
      .getAll();
    const keyedResults = _.groupBy(unorderedResults, (entity) =>
      this.mapEntityToKey(entity)
    );
    const results = valuesToFetch.map((value) => keyedResults[value]);
    return results;
  };

  /**
   * Load a single entity whose field is `value`. One value => one entity.
   *
   * Example: for a beltalowda for the ID field, you can use this method to
   * fetch an entity given its ID.
   */
  async loadOneFromOneValue(value: FieldType): Promise<Model | undefined> {
    const entities = await this.loadManyFromOneValue(value);
    return entities[0];
  }

  /**
   * Load all entities whose field is `value`. One value => any number of
   * entities.
   *
   * Example: for a beltalowda for a category field, you can use this method to
   * fetch all entities with a category.
   */
  async loadManyFromOneValue(value: FieldType): Promise<Model[]> {
    const entities = await this.dataloader.load(value);
    return entities ?? [];
  }

  /**
   * Load a single entity for each value in `values`. One value => one entity.
   *
   * Example: for a beltalowda for the ID field, you can use this method to
   * fetch entities given a list of IDs.
   */
  async loadManyWithOneEntityEach(
    values: FieldType[]
  ): Promise<(Model | Error | undefined)[]> {
    const manyEntitiesOrError = await this.loadManyWithManyEntitiesEach(values);
    return manyEntitiesOrError.map((entitiesOrError) =>
      entitiesOrError instanceof Error ? entitiesOrError : entitiesOrError[0]
    );
  }

  /**
   * Load multiple entities for each value in `values`. One value => any number
   * of entities.
   *
   * Example: for a beltalowda for a category field, you can use this method to
   * fetch the entities with each category in a list of categories.
   */
  async loadManyWithManyEntitiesEach(
    values: FieldType[]
  ): Promise<(Model[] | Error)[]> {
    const loadedResults = await this.dataloader.loadMany(values);
    return loadedResults.map((result) => result ?? []);
  }
}
