import { AnyEntity, Primary } from "mikro-orm";
import { CollectionItem } from "mikro-orm/dist/typings";

export interface GentModel extends AnyEntity<GentModel, "id"> {
  id: number;
}

export interface GentModelClass<Model extends GentModel> extends Function {
  new (): Model;
}

export type GentModelData<Model extends GentModel> = {
  [K in keyof Model]?:
    | Model[K]
    | Primary<Model[K]>
    | CollectionItem<Model[K]>[];
};
