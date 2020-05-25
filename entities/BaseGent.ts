import { PrimaryKey, Property } from 'mikro-orm';

export abstract class BaseGent {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
