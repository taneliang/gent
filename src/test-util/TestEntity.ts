import { Entity, PrimaryKey } from "mikro-orm";
import { GentModel } from "..";

@Entity()
export class TestEntity implements GentModel {
  @PrimaryKey()
  id!: number;
}
