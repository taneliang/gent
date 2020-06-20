import { EntityData } from "mikro-orm";
import { GentModel } from "./GentModel";
import { ViewerContext } from "./ViewerContext";

// TODO: Fix all these disgusting leaky abstractions

/**
 * An observer with hooks that are executed when `GentMutator.create()` creates
 * `Model` records.
 */
export type CreateObserver<Model extends GentModel> = {
  /**
   * Hook that replaces the input data before the query is executed.
   * @returns An object that replaces `data` in the mutator's execution.
   */
  transformDataBeforeCreate?: (
    vc: ViewerContext,
    data: EntityData<Model>
  ) => EntityData<Model> | Promise<EntityData<Model>>;

  /**
   * Hook executed before the create query is executed. May throw an error to
   * prevent query execution.
   */
  beforeCreate?: (
    vc: ViewerContext,
    data: EntityData<Model>
  ) => void | Promise<void>;

  /**
   * Hook executed after the create query is executed.
   */
  afterCreate?: (
    vc: ViewerContext,
    data: EntityData<Model>,
    createdEntity: Model
  ) => void | Promise<void>;
};

/**
 * An observer with hooks that are executed when `GentMutator.update()` updates
 * `Model` records.
 */
export type UpdateObserver<Model extends GentModel> = {
  /**
   * Hook that replaces the input data before the query is executed.
   * @returns An object that replaces `data` in the mutator's execution.
   */
  transformDataBeforeUpdate?: (
    vc: ViewerContext,
    data: EntityData<Model>
  ) => EntityData<Model> | Promise<EntityData<Model>>;

  /**
   * Hook executed before the update query is executed. May throw an error to
   * prevent query execution.
   */
  beforeUpdate?: (
    vc: ViewerContext,
    data: EntityData<Model>
  ) => void | Promise<void>;

  /**
   * Hook executed after the update query is executed.
   */
  afterUpdate?: (
    vc: ViewerContext,
    data: EntityData<Model>,
    updatedEntities: Model[]
  ) => void | Promise<void>;
};

/**
 * An observer with hooks that are executed when `GentMutator.delete()` deletes
 * `Model` records.
 */
export type DeleteObserver<Model extends GentModel> = {
  /**
   * Hook executed before the delete query is executed. May throw an error to
   * prevent query execution.
   */
  beforeDelete?: (vc: ViewerContext) => void | Promise<void>;

  /**
   * Hook executed after the delete query is executed.
   */
  afterDelete?: (
    vc: ViewerContext,
    deletedEntities: Model[]
  ) => void | Promise<void>;
};

/**
 * An observer with hooks that are executed during a `Model`'s lifecycle.
 */
export type LifecycleObserver<Model extends GentModel> = CreateObserver<Model> &
  UpdateObserver<Model> &
  DeleteObserver<Model>;

/**
 * Returns a new `LifecycleObserver` that does 2 things:
 * - On create, sets the created and updated at field of the data to be
 *   mutated.
 * - On update, sets the updated at field of the data to be mutated.
 *
 * @param createdAtFieldName Created at model field name. Default: `createdAt`
 * @param updatedAtFieldName Updated at model field name. Default: `updatedAt`
 */
export function makeTimestampObserver<Model extends GentModel>(
  createdAtFieldName = "createdAt",
  updatedAtFieldName = "updatedAt"
): LifecycleObserver<Model> {
  return {
    transformDataBeforeCreate(
      _vc: ViewerContext,
      data: EntityData<Model>
    ): EntityData<Model> {
      return {
        ...data,
        [createdAtFieldName]: new Date(),
        [updatedAtFieldName]: new Date(),
      };
    },
    transformDataBeforeUpdate(
      _vc: ViewerContext,
      data: EntityData<Model>
    ): EntityData<Model> {
      return {
        ...data,
        [updatedAtFieldName]: new Date(),
      };
    },
  };
}
