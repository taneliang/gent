import Dataloader from 'dataloader';
import _ from 'lodash';
import { ViewerContext } from '.';
import { BaseGent } from './entities/BaseGent';
import { EntityClass } from 'mikro-orm/dist/typings';

/**
 * The internal underlying layer below the user-facing GentLoader. It gathers
 * values to be loaded for one field and loads them in a batch, and does the
 * gruntwork of applying authorization checks.
 */
export class GentBeltalowda<Model extends BaseGent, FieldType extends string | number> {
  readonly vc: ViewerContext;
  readonly entityClass: EntityClass<Model>;
  readonly fieldNameToFilter: string;
  readonly mapEntityToKey: (entity: Model) => FieldType;

  private readonly dataloader: Dataloader<FieldType, Model[]>;

  constructor(
    vc: ViewerContext,
    entityClass: EntityClass<Model>,
    fieldNameToFilter: string,
    mapEntityToKey: (entity: Model) => FieldType,
  ) {
    this.vc = vc;
    this.entityClass = entityClass;
    this.fieldNameToFilter = fieldNameToFilter;
    this.mapEntityToKey = mapEntityToKey;
    this.dataloader = new Dataloader(this.#batchLoadFunction);
  }

  readonly #batchLoadFunction: Dataloader.BatchLoadFn<FieldType, Model[]> = async (
    valuesToFetch,
  ) => {
    // this.applyPreflightRules();

    const unorderedResults = await this.vc.entityManager
      .createQueryBuilder(this.entityClass)
      .select('*')
      .where({ [this.fieldNameToFilter]: { $in: valuesToFetch } })
      .getResult();

    const keyedResults = _.groupBy(unorderedResults, (entity) => this.mapEntityToKey(entity));
    const results = valuesToFetch.map((value) => keyedResults[value]);
    return results;
  };

  // protected abstract getBatchQueryResults(valuesToFetch: readonly FieldType[]): Promise<Model[]>;
  // abstract applyAccessControlRules(): void;

  async loadOneFromOneValue(value: FieldType): Promise<Model | undefined> {
    const entities = await this.loadManyFromOneValue(value);
    return entities[0];
  }

  async loadManyFromOneValue(value: FieldType): Promise<Model[]> {
    const entities = await this.dataloader.load(value);
    return entities;
  }

  async loadManyWithOneEntityEach(values: FieldType[]): Promise<(Model | Error | undefined)[]> {
    const manyEntitiesOrError = await this.loadManyWithManyEntitiesEach(values);
    return manyEntitiesOrError.map((entitiesOrError) =>
      entitiesOrError instanceof Error ? entitiesOrError : entitiesOrError[0],
    );
  }

  async loadManyWithManyEntitiesEach(values: FieldType[]): Promise<(Model[] | Error)[]> {
    return this.dataloader.loadMany(values);
  }
}
