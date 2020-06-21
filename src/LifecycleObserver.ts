import { GentModel, GentModelData } from "./GentModel";
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
    data: GentModelData<Model>
  ) => GentModelData<Model> | Promise<GentModelData<Model>>;

  /**
   * Hook executed before the create query is executed. May throw an error to
   * prevent query execution.
   */
  beforeCreate?: (
    vc: ViewerContext,
    data: GentModelData<Model>
  ) => void | Promise<void>;

  /**
   * Hook executed after the create query is executed.
   */
  afterCreate?: (
    vc: ViewerContext,
    data: GentModelData<Model>,
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
    data: GentModelData<Model>
  ) => GentModelData<Model> | Promise<GentModelData<Model>>;

  /**
   * Hook executed before the update query is executed. May throw an error to
   * prevent query execution.
   */
  beforeUpdate?: (
    vc: ViewerContext,
    data: GentModelData<Model>
  ) => void | Promise<void>;

  /**
   * Hook executed after the update query is executed.
   */
  afterUpdate?: (
    vc: ViewerContext,
    data: GentModelData<Model>,
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
 * Returns a new `LifecycleObserver` that, on update, sets the updated at field
 * of the data to be mutated.
 *
 * Recommended to be paired with `createdAt` and `updatedAt` fields with
 * a `defaultValueCode: "NOW()"` specification.
 *
 * @param updatedAtFieldName Updated at model field name. Default: `updatedAt`
 */
export function makeUpdateTimestampUpdater<Model extends GentModel>(
  updatedAtFieldName = "updatedAt"
): LifecycleObserver<Model> {
  return {
    transformDataBeforeUpdate(
      _vc: ViewerContext,
      data: GentModelData<Model>
    ): GentModelData<Model> {
      return {
        ...data,
        [updatedAtFieldName]: new Date(),
      };
    },
  };
}
