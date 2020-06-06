import { IdEntity, PrimaryKey, Property } from "mikro-orm";

export abstract class BaseGent implements IdEntity<BaseGent> {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  // TODO: Fix this; update hooks are not called by GentMutator as we bypass
  // MikroORM. Try to move back to MikroORM for mutations?
  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
