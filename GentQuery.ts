import { ViewerContext } from './ViewerContext';
import { QueryBuilder } from 'mikro-orm';
import { EntityClass, AnyEntity } from 'mikro-orm/dist/typings';
import { BaseGent } from './BaseGent';

export type GentQueryGraphViewRestricter<GentQuerySubclass> = (
  childQuery: GentQuerySubclass,
) => Promise<void>;

export abstract class GentQuery<Model extends BaseGent> {
  readonly vc: ViewerContext;

  protected readonly queryBuilder: QueryBuilder<Model>;

  private readonly graphViewRestrictor: GentQueryGraphViewRestricter<this> | undefined;

  constructor(
    vc: ViewerContext,
    entityClass: EntityClass<Model>,
    graphViewRestrictor: GentQueryGraphViewRestricter<any> | undefined = undefined,
  ) {
    this.vc = vc;
    this.graphViewRestrictor = graphViewRestrictor;
    this.queryBuilder = this.vc.entityManager.createQueryBuilder(entityClass);
  }

  whereIdsIn(ids: number[]) {
    this.queryBuilder.where({ id: { $in: ids } });
  }

  private async applyGraphViewRestrictions() {
    if (!this.graphViewRestrictor) {
      return;
    }
    await this.graphViewRestrictor(this);
  }

  async getIds(): Promise<number[]> {
    await this.applyGraphViewRestrictions();
    const gentsWithIds = await this.queryBuilder.clone().select('id', true).getResult();
    return gentsWithIds.map((gent) => gent.id);
  }

  async getOne(): Promise<Model | null> {
    await this.applyGraphViewRestrictions();
    return this.queryBuilder.clone().select('*').getSingleResult();
  }

  async getAll(): Promise<Model[]> {
    await this.applyGraphViewRestrictions();
    return this.queryBuilder.clone().select('*').getResult();
  }
}
