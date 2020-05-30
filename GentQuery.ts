import { ViewerContext } from './ViewerContext';
import { QueryBuilder } from 'knex';
import { EntityData } from 'mikro-orm';
import { EntityClass } from 'mikro-orm/dist/typings';
import { BaseGent } from './entities/BaseGent';

export type GentQueryGraphViewRestricter<GentQuerySubclass> = (
  childQuery: GentQuerySubclass,
) => Promise<void>;

export abstract class GentQuery<Model extends BaseGent> {
  readonly vc: ViewerContext;

  protected entityClass: EntityClass<Model>;
  protected readonly queryBuilder: QueryBuilder<Model>;

  private readonly graphViewRestrictor: GentQueryGraphViewRestricter<GentQuery<Model>> | undefined;

  constructor(
    vc: ViewerContext,
    entityClass: EntityClass<Model>,
    graphViewRestrictor: GentQueryGraphViewRestricter<any> | undefined = undefined,
    shouldApplyAccessControlRules = true,
  ) {
    this.vc = vc;
    this.entityClass = entityClass;
    this.graphViewRestrictor = graphViewRestrictor;
    this.queryBuilder = this.vc.entityManager
      .createQueryBuilder(entityClass)
      .select('*')
      .getKnexQuery();
    if (shouldApplyAccessControlRules) {
      this.applyAccessControlRules();
    }
  }

  abstract applyAccessControlRules(): void;

  buildKnexQueryBuilder(builder: (qb: QueryBuilder<Model>) => void) {
    builder(this.queryBuilder);
    return this;
  }

  whereId(id: number): this {
    this.queryBuilder.where('id', id);
    return this;
  }

  whereIdsIn(ids: number[]): this {
    this.queryBuilder.whereIn('id', ids);
    return this;
  }

  private async applyGraphViewRestrictions() {
    if (!this.graphViewRestrictor) {
      return;
    }
    await this.graphViewRestrictor(this);
  }

  async getIds(): Promise<number[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder.clone().clearSelect().select('id');
    const results: EntityData<Model>[] = await this.vc.entityManager
      .getConnection('read')
      .execute(finalQb as any);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result),
    );
    return resultEntities.map((gent) => gent.id);
  }

  async getOne(): Promise<Model | undefined> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder.clone().first();
    const result: EntityData<Model> | undefined = await this.vc.entityManager
      .getConnection('read')
      .execute(finalQb as any);
    return result ? this.vc.entityManager.map(this.entityClass, result) : undefined;
  }

  async getAll(): Promise<Model[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder;
    const results: EntityData<Model>[] = await this.vc.entityManager
      .getConnection('read')
      .execute(finalQb as any);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result),
    );
    return resultEntities;
  }
}
