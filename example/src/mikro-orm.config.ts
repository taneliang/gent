import { Options } from "mikro-orm";
import * as Models from "./gents/models";

const options: Options = {
  debug: true,
  dbName: "./temp/gentexample.sqlite",
  type: "sqlite",
  entities: Object.values(Models),
};

export default options;
