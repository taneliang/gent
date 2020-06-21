import { QueryBuilder, EntityData } from "mikro-orm";
import {
  QueryBuilder as KnexQueryBuilder,
  Transaction as KnexTransaction,
} from "knex";
import {
  GentModel,
  GentModelClass,
  GentModelData,
  LifecycleObserver,
  ViewerContext,
} from ".";

export const mutationActions = ["create", "update", "delete"] as const;
export type MutationAction = typeof mutationActions[number];

/**
 * A callback function that restricts the mutation to a subset of the data.
 *
 * TODO: Throw error when restrictors return a Knex QB -- they will be awaited
 * and a query will be silently executed.
 */
export type GentMutatorGraphViewRestricter<GentMutatorSubclass> = (
  childMutator: GentMutatorSubclass,
  knexQueryBuilder: KnexQueryBuilder
) => void | Promise<void>;

/**
 * A query builder that mutates (i.e. create, update, delete) records for an
 * entity. It is a thin wrapper around Knex's query builder that enforces
 * access control rules defined in the entity's schema.
 *
 * To be used through subclasses generated for an entity.
 */
export abstract class GentMutator<Model extends GentModel> {
  readonly vc: ViewerContext;

  protected readonly entityClass: GentModelClass<Model>;
  protected readonly lifecycleObservers?: LifecycleObserver<Model>[];

  /**
   * A Knex query builder that contains the current state of the query.
   * @package
   */
  readonly queryBuilder: QueryBuilder<Model>;

  private readonly graphViewRestrictor:
    | GentMutatorGraphViewRestricter<GentMutator<Model>>
    | undefined;

  private transaction?: KnexTransaction;

  /**
   * @param vc The viewer context performing the query.
   * @param entityClass The database entity class that this query will mutate.
   * @param graphViewRestrictor A callback function that restricts the the
   * query to a subset of the data. Useful when traversing the graph without
   * using joins. Should typically only be set by generated classes.
   */
  constructor(
    vc: ViewerContext,
    entityClass: GentModelClass<Model>,
    graphViewRestrictor:
      | GentMutatorGraphViewRestricter<any> // eslint-disable-line @typescript-eslint/no-explicit-any
      | undefined = undefined
  ) {
    this.vc = vc;
    this.entityClass = entityClass;
    this.graphViewRestrictor = graphViewRestrictor;
    this.queryBuilder = this.vc.entityManager
      .createQueryBuilder(entityClass)
      .select("*");
  }

  /**
   * Applies access control rules defined in the entity's schema to this
   * mutation.
   */
  protected abstract applyAccessControlRules(
    action: MutationAction,
    knexQueryBuilder: KnexQueryBuilder
  ): void;

  /**
   * Perform all actions in this transaction.
   * @param transaction Knex transaction.
   */
  inTransaction(transaction: KnexTransaction): this {
    this.transaction = transaction;
    return this;
  }

  /**
   * Creates a single entity, subject to access control rules defined on the
   * entity's schema.
   *
   * @param inputData An plain object with the necessary fields to create an
   * entity.
   * @returns A promise that resolves to the created entity object.
   */
  async create(inputData: GentModelData<Model>): Promise<Model> {
    let data = inputData;
    if (this.lifecycleObservers) {
      for (const observer of this.lifecycleObservers) {
        data =
          (await observer.transformDataBeforeCreate?.(this.vc, data)) ?? data;
      }
    }

    const finalKnexQb = this.queryBuilder
      .clone()
      .insert(data)
      .getKnexQuery()
      .returning("*");
    if (this.graphViewRestrictor) {
      await this.graphViewRestrictor(this, finalKnexQb);
    }
    if (this.transaction) {
      finalKnexQb.transacting(this.transaction);
    }
    this.applyAccessControlRules("create", finalKnexQb);

    if (this.lifecycleObservers) {
      await Promise.all(
        this.lifecycleObservers.map((observer) =>
          observer.beforeCreate?.(this.vc, data)
        )
      );
    }

    const results: EntityData<
      Model
    >[] = await this.vc.entityManager
      .getConnection("write")
      .execute(finalKnexQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map<Model>(this.entityClass, result)
    );
    const resultEntity = resultEntities[0];

    if (this.lifecycleObservers) {
      await Promise.all(
        this.lifecycleObservers.map((observer) =>
          observer.afterCreate?.(this.vc, data, resultEntity)
        )
      );
    }

    return resultEntity;
  }

  /**
   * Updates the entities this mutator has been asked to mutate.
   *
   * You may specify the entities you wish to be updated (subject to access
   * control rules defined on the entity's schema) by creating the mutator from
   * a `GentQuery` subclass, or by passing the entities directly to the
   * `fromEntities` static method generated on all `GentMutator` subclasses.
   *
   * @param inputData An plain object with the necessary fields to update the
   * entities.
   * @returns A promise that resolves to all the updated entity objects.
   */
  async update(inputData: GentModelData<Model>): Promise<Model[]> {
    let data = inputData;
    if (this.lifecycleObservers) {
      for (const observer of this.lifecycleObservers) {
        data =
          (await observer.transformDataBeforeUpdate?.(this.vc, data)) ?? data;
      }
    }

    const finalKnexQb = this.queryBuilder
      .clone()
      .update(data)
      .getKnexQuery()
      .returning("*");
    if (this.graphViewRestrictor) {
      await this.graphViewRestrictor(this, finalKnexQb);
    }
    if (this.transaction) {
      finalKnexQb.transacting(this.transaction);
    }
    this.applyAccessControlRules("update", finalKnexQb);

    if (this.lifecycleObservers) {
      await Promise.all(
        this.lifecycleObservers.map((observer) =>
          observer.beforeUpdate?.(this.vc, data)
        )
      );
    }

    const results: EntityData<
      Model
    >[] = await this.vc.entityManager
      .getConnection()
      .execute(finalKnexQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map<Model>(this.entityClass, result)
    );

    if (this.lifecycleObservers) {
      await Promise.all(
        this.lifecycleObservers.map((observer) =>
          observer.afterUpdate?.(this.vc, data, resultEntities)
        )
      );
    }

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
  async delete(): Promise<Model[]> {
    const finalKnexQb = this.queryBuilder
      .clone()
      .delete()
      .getKnexQuery()
      .returning("*");
    if (this.graphViewRestrictor) {
      await this.graphViewRestrictor(this, finalKnexQb);
    }
    if (this.transaction) {
      finalKnexQb.transacting(this.transaction);
    }
    this.applyAccessControlRules("delete", finalKnexQb);

    if (this.lifecycleObservers) {
      await Promise.all(
        this.lifecycleObservers.map((observer) =>
          observer.beforeDelete?.(this.vc)
        )
      );
    }

    const results: EntityData<
      Model
    >[] = await this.vc.entityManager
      .getConnection("write")
      .execute(finalKnexQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map<Model>(this.entityClass, result)
    );

    if (this.lifecycleObservers) {
      await Promise.all(
        this.lifecycleObservers.map((observer) =>
          observer.afterDelete?.(this.vc, resultEntities)
        )
      );
    }

    // TODO: Figure out how to avoid nuking the identity map
    this.vc.entityManager.clear();
    return resultEntities;
  }
}
