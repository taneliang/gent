import { Primary } from "mikro-orm";
import { CollectionItem, EntityClass } from "mikro-orm/dist/typings";

export interface GentModel {
  id: number;
}

export type GentModelClass<Model extends GentModel> = EntityClass<Model>;

// TODO: Restrict this to only Model's fields and relation IDs
export type GentModelData<Model extends GentModel> = {
  [K in keyof Model]?:
    | Model[K]
    | Primary<Model[K]>
    | CollectionItem<Model[K]>[];
};
