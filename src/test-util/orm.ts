import { initOrm } from "../orm";
import { TestEntity } from "./TestEntity";

export async function initTestOrm(): Promise<void> {
  await initOrm({
    debug: true,
    dbName: "/tmp/genttests.sqlite",
    type: "sqlite",
    entities: [TestEntity],
  });
}
