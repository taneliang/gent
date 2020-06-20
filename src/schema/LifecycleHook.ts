import { EntityData } from "mikro-orm";
import { GentModel } from "../GentModel";
import { ViewerContext } from "../ViewerContext";

// TODO: Fix all these disgusting leaky abstractions
export type LifecycleHook<Model extends GentModel> = {
  beforeCreate?: (
    vc: ViewerContext,
    data: EntityData<Model>
  ) => void | Promise<void>;
  afterCreate?: (
    vc: ViewerContext,
    data: EntityData<Model>,
    createdEntity: Model
  ) => void | Promise<void>;

  beforeUpdate?: (
    vc: ViewerContext,
    data: EntityData<Model>
  ) => void | Promise<void>;
  afterUpdate?: (
    vc: ViewerContext,
    data: EntityData<Model>,
    updatedEntities: Model[]
  ) => void | Promise<void>;

  beforeDelete?: (vc: ViewerContext) => void | Promise<void>;
  afterDelete?: (
    vc: ViewerContext,
    deletedEntities: Model[]
  ) => void | Promise<void>;
};
