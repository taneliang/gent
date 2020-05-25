import { IdEntity, PrimaryKey, Property } from 'mikro-orm';

export abstract class BaseGent implements IdEntity<BaseGent> {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
