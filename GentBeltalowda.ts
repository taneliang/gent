import Dataloader from 'dataloader';
import _ from 'lodash';
import { ViewerContext } from '.';
import { BaseGent } from './entities/BaseGent';
import { GentQuery } from './GentQuery';

/**
 * The internal underlying layer below the user-facing GentLoader. It gathers
 * values to be loaded for one field and loads them in a batch.
 */
export class GentBeltalowda<Model extends BaseGent, FieldType extends string | number> {
  readonly vc: ViewerContext;
  readonly queryConstructor: () => GentQuery<Model>;
  readonly fieldNameToFilter: string;
  readonly mapEntityToKey: (entity: Model) => FieldType;

  private readonly dataloader: Dataloader<FieldType, Model[] | undefined>;

  constructor(
    vc: ViewerContext,
    queryConstructor: () => GentQuery<Model>,
    fieldNameToFilter: string,
    mapEntityToKey: (entity: Model) => FieldType,
  ) {
    this.vc = vc;
    this.queryConstructor = queryConstructor;
    this.fieldNameToFilter = fieldNameToFilter;
    this.mapEntityToKey = mapEntityToKey;
    this.dataloader = new Dataloader(this.#batchLoadFunction);
  }

  readonly #batchLoadFunction: Dataloader.BatchLoadFn<FieldType, Model[]> = async (
    valuesToFetch,
  ) => {
    const unorderedResults = await this.queryConstructor()
      .buildKnexQueryBuilder((qb) => qb.whereIn(this.fieldNameToFilter, valuesToFetch))
      .getAll();
    const keyedResults = _.groupBy(unorderedResults, (entity) => this.mapEntityToKey(entity));
    const results = valuesToFetch.map((value) => keyedResults[value]);
    return results;
  };

  async loadOneFromOneValue(value: FieldType): Promise<Model | undefined> {
    const entities = await this.loadManyFromOneValue(value);
    return entities[0];
  }

  async loadManyFromOneValue(value: FieldType): Promise<Model[]> {
    const entities = await this.dataloader.load(value);
    return entities ?? [];
  }

  async loadManyWithOneEntityEach(values: FieldType[]): Promise<(Model | Error | undefined)[]> {
    const manyEntitiesOrError = await this.loadManyWithManyEntitiesEach(values);
    return manyEntitiesOrError.map((entitiesOrError) =>
      entitiesOrError instanceof Error ? entitiesOrError : entitiesOrError[0],
    );
  }

  async loadManyWithManyEntitiesEach(values: FieldType[]): Promise<(Model[] | Error)[]> {
    const loadedResults = await this.dataloader.loadMany(values);
    return loadedResults.map((result) => result ?? []);
  }
}
