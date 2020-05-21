import Dataloader from 'dataloader';
import _ from 'lodash';
import { ViewerContext } from '.';
import { BaseGent } from './BaseGent';
import { EntityClass } from 'mikro-orm/dist/typings';

/**
 * The internal underlying layer below the user-facing GentLoader
 * that gathers IDs to load, and does the gruntwork of applying authorization
 * checks.
 */
export abstract class GentBeltalowda<Model extends BaseGent> {
  readonly vc: ViewerContext;

  private readonly dataloader: Dataloader<number, Model>;

  constructor(vc: ViewerContext) {
    this.vc = vc;
    this.dataloader = new Dataloader(this.#batchLoadFunction);
  }

  protected abstract get entityClass(): EntityClass<Model>;

  readonly #batchLoadFunction: Dataloader.BatchLoadFn<number, Model> = async (batchIds) => {
    this.applyPreflightRules();

    const unorderedResults = await this.vc.entityManager
      .createQueryBuilder(this.entityClass)
      .select('*')
      .where({ id: { $in: batchIds } })
      .getResult();

    const keyedResults = _.keyBy(unorderedResults, (model) => model.id);
    const results = batchIds.map((id) => keyedResults[id]);
    return results;
  };

  applyPreflightRules() {
    // TODO: trigger preflight police enforcement
  }

  applyPostflightRules() {
    // TODO: trigger postflight police enforcement
  }

  async loadOne(id: number): Promise<Model | Error> {
    // TODO: Check if we need to ensure this.ids is non-empty
    return this.dataloader.load(id);
  }

  async loadMany(ids: number[]): Promise<(Model | Error)[]> {
    return this.dataloader.loadMany(ids);
  }
}

export type GentLoaderGraphViewRestricter<GentLoaderSubclass> = (
  childLoader: GentLoaderSubclass,
) => Promise<void>;

/**
 * Batches simple queries by ID/relations across multiple loader instances.
 */
export abstract class GentLoader<Model extends BaseGent> {
  readonly vc: ViewerContext;

  private ids: number[] = [];
  private readonly graphViewRestrictor: GentLoaderGraphViewRestricter<this> | undefined;

  constructor(
    vc: ViewerContext,
    graphViewRestrictor: GentLoaderGraphViewRestricter<any> | undefined = undefined,
  ) {
    this.vc = vc;
    this.graphViewRestrictor = graphViewRestrictor;
  }

  protected abstract get entityClass(): EntityClass<Model>;

  onlyIds(ids: number[]): this {
    this.ids = ids;
    return this;
  }

  onlyId(id: number): this {
    return this.onlyIds([id]);
  }

  private async applyGraphViewRestrictions() {
    if (!this.graphViewRestrictor) {
      return;
    }
    await this.graphViewRestrictor(this);
  }

  protected abstract createBeltalowdaProvider(): GentBeltalowda<Model>;

  async getOne(): Promise<Model | Error> {
    await this.applyGraphViewRestrictions();
    // TODO: Check if we need to ensure this.ids is non-empty
    return this.vc.dataloaders
      .beltalowdaForModel(this.entityClass, this.createBeltalowdaProvider.bind(this))
      .loadOne(this.ids[0]);
  }

  async getAll(): Promise<(Model | Error)[]> {
    await this.applyGraphViewRestrictions();
    return this.vc.dataloaders
      .beltalowdaForModel(this.entityClass, this.createBeltalowdaProvider.bind(this))
      .loadMany(this.ids);
  }
}
