import { ViewerContext } from ".";
import { BaseGent } from "./entities/BaseGent";
import { EntityClass } from "mikro-orm/dist/typings";
import { Beltalowda } from "./Beltalowda";

/**
 * A callback function that restricts the the query to a subset of the data.
 */
export type GentLoaderGraphViewRestricter<GentLoaderSubclass> = (
  childLoader: GentLoaderSubclass
) => Promise<void>;

/**
 * A simple query builder. Queries are batched together with those of other
 * related `GentLoader`s before being executed.
 *
 * Fewer query methods are present due as it is difficult to batch many kinds
 * of queries in SQL. If query batching is not needed, see `GentQuery` for more
 * powerful querying capabilities.
 *
 * Uses `Beltalowda` to batch its queries, and `GentQuery` to enforce access
 * control rules.
 *
 * To be used through subclasses generated for an entity.
 */
export abstract class GentLoader<Model extends BaseGent> {
  readonly vc: ViewerContext;

  protected ids: number[] = [];
  private readonly graphViewRestrictor:
    | GentLoaderGraphViewRestricter<this>
    | undefined;

  /**
   * @param vc The viewer context performing the query.
   * @param graphViewRestrictor A callback function that restricts the the
   * query to a subset of the data. Useful when traversing the graph without
   * using joins. Should typically only be set by generated classes.
   */
  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentLoaderGraphViewRestricter<any> // eslint-disable-line @typescript-eslint/no-explicit-any
      | undefined = undefined
  ) {
    this.vc = vc;
    this.graphViewRestrictor = graphViewRestrictor;
  }

  /**
   * The database entity class that this loader will query.
   */
  protected abstract get entityClass(): EntityClass<Model>;

  /**
   * Sets the IDs this loader is operating on to `ids`.
   */
  onlyIds(ids: number[]): this {
    this.ids = ids;
    return this;
  }

  /**
   * Sets the single ID this loader is operating on to `id`.
   */
  onlyId(id: number): this {
    return this.onlyIds([id]);
  }

  private async applyGraphViewRestrictions() {
    if (!this.graphViewRestrictor) {
      return;
    }
    await this.graphViewRestrictor(this);
  }

  /**
   * Returns the shared `Beltalowda` instance for the current viewer context
   * that batches all queries filtering on this entity's ID.
   */
  protected abstract createIdBeltalowda(): Beltalowda<Model, number>;

  /**
   * If there is at least one element in the result set, returns it, otherwise
   * returns undefined.
   */
  async getOne(): Promise<Model | undefined> {
    if (this.ids.length === 0) {
      return undefined;
    }
    await this.applyGraphViewRestrictions();
    return this.vc.beltalowdas
      .beltalowdaForModel(
        this.entityClass,
        "id",
        this.createIdBeltalowda.bind(this)
      )
      .loadOneFromOneValue(this.ids[0]);
  }

  /**
   * Returns the result set.
   *
   * Note: If no IDs were set on this loader (e.g. if you simply create a new
   * loader and call `getAll`), this will return an empty array.
   */
  async getAll(): Promise<(Model | Error | undefined)[]> {
    await this.applyGraphViewRestrictions();
    return this.vc.beltalowdas
      .beltalowdaForModel(
        this.entityClass,
        "id",
        this.createIdBeltalowda.bind(this)
      )
      .loadManyWithOneEntityEach(this.ids);
  }
}
