import { ViewerContext } from '.';
import { BaseGent } from './entities/BaseGent';
import { EntityClass } from 'mikro-orm/dist/typings';
import { GentBeltalowda } from './GentBeltalowda';

export type GentLoaderGraphViewRestricter<GentLoaderSubclass> = (
  childLoader: GentLoaderSubclass,
) => Promise<void>;

/**
 * Batches simple queries by ID/relations across multiple loader instances.
 */
export abstract class GentLoader<Model extends BaseGent> {
  readonly vc: ViewerContext;

  protected ids: number[] = [];
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

  protected abstract createIdBeltalowda(): GentBeltalowda<Model, number>;

  async getOne(): Promise<Model | undefined> {
    if (this.ids.length === 0) {
      return undefined;
    }
    await this.applyGraphViewRestrictions();
    return this.vc.dataloaders
      .beltalowdaForModel(this.entityClass, 'id', this.createIdBeltalowda.bind(this))
      .loadOneFromOneValue(this.ids[0]);
  }

  async getAll(): Promise<(Model | Error | undefined)[]> {
    await this.applyGraphViewRestrictions();
    return this.vc.dataloaders
      .beltalowdaForModel(this.entityClass, 'id', this.createIdBeltalowda.bind(this))
      .loadManyWithOneEntityEach(this.ids);
  }
}
