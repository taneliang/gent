import { GentQuery } from "..";
import { TestEntity } from "./TestEntity";
import { GentMutator } from "../GentMutator";

export class TestEntityQuery extends GentQuery<TestEntity> {
  applyAccessControlRules(): void {}

  mutate(): GentMutator<TestEntity> {
    throw new Error("Method not implemented.");
  }
}
