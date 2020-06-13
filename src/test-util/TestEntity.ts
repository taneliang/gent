import { Entity, PrimaryKey } from "mikro-orm";
import { BaseGent } from "..";

@Entity()
export class TestEntity implements BaseGent {
  @PrimaryKey()
  id!: number;
}
