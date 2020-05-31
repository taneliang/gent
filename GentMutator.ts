import { QueryBuilder } from 'mikro-orm';
import { QueryBuilder as KnexQueryBuilder } from 'knex';
import { EntityClass, EntityData } from 'mikro-orm/dist/typings';
import { BaseGent, ViewerContext } from '.';

export const mutationActions = ['create', 'update', 'delete'] as const;
export type MutationAction = typeof mutationActions[number];

export type GentMutatorGraphViewRestricter<GentMutatorSubclass> = (
  childMutator: GentMutatorSubclass,
  knexQueryBuilder: KnexQueryBuilder,
) => void | Promise<void>;

export abstract class GentMutator<Model extends BaseGent> {
  readonly vc: ViewerContext;

  protected entityClass: EntityClass<Model>;
  readonly queryBuilder: QueryBuilder<Model>;

  private readonly graphViewRestrictor:
    | GentMutatorGraphViewRestricter<GentMutator<Model>>
    | undefined;

  constructor(
    vc: ViewerContext,
    entityClass: EntityClass<Model>,
    graphViewRestrictor: GentMutatorGraphViewRestricter<any> | undefined = undefined,
  ) {
    this.vc = vc;
    this.entityClass = entityClass;
    this.graphViewRestrictor = graphViewRestrictor;
    this.queryBuilder = this.vc.entityManager.createQueryBuilder(entityClass).select('*');
  }

  abstract applyAccessControlRules(
    action: MutationAction,
    knexQueryBuilder: KnexQueryBuilder,
  ): void;

  async create(data: any): Promise<Model> {
    const finalKnexQb = this.queryBuilder.clone().insert(data).getKnexQuery().returning('*');
    if (this.graphViewRestrictor) {
      await this.graphViewRestrictor(this, finalKnexQb);
    }
    this.applyAccessControlRules('create', finalKnexQb);

    const results: EntityData<Model>[] = await this.vc.entityManager
      .getConnection('write')
      .execute(finalKnexQb as any);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result),
    );
    return resultEntities[0];
  }

  async update(data: any): Promise<Model[]> {
    const finalKnexQb = this.queryBuilder.clone().update(data).getKnexQuery().returning('*');
    if (this.graphViewRestrictor) {
      await this.graphViewRestrictor(this, finalKnexQb);
    }
    this.applyAccessControlRules('update', finalKnexQb);

    const results: EntityData<Model>[] = await this.vc.entityManager
      .getConnection()
      .execute(finalKnexQb as any);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result),
    );
    return resultEntities;
  }

  async delete(): Promise<void> {
    const finalKnexQb = this.queryBuilder.clone().delete().getKnexQuery();
    if (this.graphViewRestrictor) {
      await this.graphViewRestrictor(this, finalKnexQb);
    }
    this.applyAccessControlRules('delete', finalKnexQb);

    await this.vc.entityManager.getConnection('write').execute(finalKnexQb as any);
    // TODO: Figure out how to avoid nuking the identity map
    this.vc.entityManager.clear();
  }
}
