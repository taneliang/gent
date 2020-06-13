import { ViewerContext } from "./ViewerContext";
import { QueryBuilder } from "knex";
import { EntityData } from "mikro-orm";
import { EntityClass } from "mikro-orm/dist/typings";
import { GentModel } from "./GentModel";
import { GentMutator } from "./GentMutator";

/**
 * A callback function that restricts the the query to a subset of the data.
 */
export type GentQueryGraphViewRestricter<GentQuerySubclass> = (
  childQuery: GentQuerySubclass
) => Promise<void>;

/**
 * A query builder and executor for a particular entity. If query batching is
 * desired, please use `GentLoader` instead.
 *
 * Wraps Knex's query builder with typesafe query methods based on the entity
 * the query class is generated for.
 *
 * `GentQuery` enforces access control rules defined in the entity's schema.
 *
 * To be used through subclasses generated for an entity.
 */
export abstract class GentQuery<Model extends GentModel> {
  readonly vc: ViewerContext;

  protected entityClass: EntityClass<Model>;

  /**
   * A Knex query builder that contains the current state of the query.
   * @package
   */
  readonly queryBuilder: QueryBuilder<Model>;

  private readonly graphViewRestrictor:
    | GentQueryGraphViewRestricter<GentQuery<Model>>
    | undefined;

  /**
   * @param vc The viewer context performing the query.
   * @param entityClass The database entity class that this query will query.
   * @param graphViewRestrictor A callback function that restricts the the
   * query to a subset of the data. Useful when traversing the graph without
   * using joins. Should typically only be set by generated classes.
   * @param shouldApplyAccessControlRules If set to false, disables access
   * control checks for the query. Useful when using GentQuery within an access
   * control check. Should typically only be set by generated classes.
   */
  constructor(
    vc: ViewerContext,
    entityClass: EntityClass<Model>,
    graphViewRestrictor:
      | GentQueryGraphViewRestricter<any> // eslint-disable-line @typescript-eslint/no-explicit-any
      | undefined = undefined,
    shouldApplyAccessControlRules = true
  ) {
    this.vc = vc;
    this.entityClass = entityClass;
    this.graphViewRestrictor = graphViewRestrictor;
    this.queryBuilder = this.vc.entityManager
      .createQueryBuilder(entityClass)
      .select("*")
      .getKnexQuery();
    if (shouldApplyAccessControlRules) {
      this.applyAccessControlRules();
    }
  }

  /**
   * Applies access control rules defined in the entity's schema to this query.
   */
  protected abstract applyAccessControlRules(): void;

  /**
   * Returns a mutator that will mutate the results of this query.
   */
  abstract mutate(): GentMutator<Model>;

  /**
   * Build the query using the underlying Knex query builder.
   *
   * **CAUTION:** manually modified Knex query builders may not have access
   * control rules applied correctly. In particular, joins will not have
   * authorization checks applied. Be sure to test thoroughly if you use this.
   *
   * Intended to be an escape hatch if the generated query does not support
   * your use case. However, we recommend generating a manual query method on
   * the query subclass instead to maintain this class's abstraction barrier.
   *
   * @param builder A function that modifies the Knex query builder.
   */
  buildKnexQueryBuilder(builder: (qb: QueryBuilder<Model>) => void): this {
    builder(this.queryBuilder);
    return this;
  }

  protected async applyGraphViewRestrictions(): Promise<void> {
    if (!this.graphViewRestrictor) {
      return;
    }
    await this.graphViewRestrictor(this);
  }

  /**
   * If there is at least one element in the result set, returns it, otherwise
   * returns undefined.
   */
  async getOne(): Promise<Model | undefined> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder.clone().first();
    const result:
      | EntityData<Model>
      | undefined = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    return result
      ? this.vc.entityManager.map(this.entityClass, result)
      : undefined;
  }

  /**
   * Returns the result set.
   */
  async getAll(): Promise<Model[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder;
    const results: EntityData<
      Model
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return resultEntities;
  }
}
