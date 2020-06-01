import { QueryBuilder } from 'mikro-orm';
import { QueryBuilder as KnexQueryBuilder } from 'knex';
import { EntityClass, EntityData } from 'mikro-orm/dist/typings';
import { BaseGent, ViewerContext } from '.';

export const mutationActions = ['create', 'update', 'delete'] as const;
export type MutationAction = typeof mutationActions[number];

/**
 * A callback function that restricts the mutation to a subset of the data.
 */
export type GentMutatorGraphViewRestricter<GentMutatorSubclass> = (
  childMutator: GentMutatorSubclass,
  knexQueryBuilder: KnexQueryBuilder,
) => void | Promise<void>;

/**
 * A query builder that mutates (i.e. create, update, delete) records for an
 * entity. It is a thin wrapper around Knex's query builder that enforces
 * access control rules defined in the entity's schema.
 *
 * To be used through subclasses generated for an entity.
 */
export abstract class GentMutator<Model extends BaseGent> {
  readonly vc: ViewerContext;

  protected entityClass: EntityClass<Model>;

  /**
   * A Knex query builder that contains the current state of the query.
   * @package
   */
  readonly queryBuilder: QueryBuilder<Model>;

  private readonly graphViewRestrictor:
    | GentMutatorGraphViewRestricter<GentMutator<Model>>
    | undefined;

  /**
   * @param vc The viewer context performing the query.
   * @param entityClass The database entity class that this query will mutate.
   * @param graphViewRestrictor A callback function that restricts the the
   * query to a subset of the data. Useful when traversing the graph without
   * using joins. Should typically only be set by generated classes.
   */
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

  /**
   * Applies access control rules defined in the entity's schema to this
   * mutation.
   */
  abstract applyAccessControlRules(
    action: MutationAction,
    knexQueryBuilder: KnexQueryBuilder,
  ): void;

  /**
   * Creates a single entity, subject to access control rules defined on the
   * entity's schema.
   *
   * @param data An entity model class or a plain object with the necessary
   * fields to create an entity.
   * @returns A promise that resolves to the created entity object.
   */
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

  /**
   * Updates the entities this mutator has been asked to mutate.
   *
   * You may specify the entities you wish to be updated (subject to access
   * control rules defined on the entity's schema) by creating the mutator from
   * a `GentQuery` subclass, or by passing the entities directly to the
   * `fromEntities` static method generated on all `GentMutator` subclasses.
   *
   * @param data An entity model class or a plain object with the necessary
   * fields to update the entities.
   * @returns A promise that resolves to all the updated entity objects.
   */
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

  /**
   * Deletes the entities this mutator has been asked to mutate.
   *
   * You may specify the entities you wish to be deleted (subject to access
   * control rules defined on the entity's schema) by creating the mutator from
   * a `GentQuery` subclass, or by passing the entities directly to the
   * `fromEntities` static method generated on all `GentMutator` subclasses.
   */
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
