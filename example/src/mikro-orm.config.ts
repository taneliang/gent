import { Options } from "mikro-orm";
// import { Post } from "./gents/Post/Post";
import * as Models from "./gents/models";

const options: Options = {
  debug: true,
  dbName: "./temp/gentexample.sqlite",
  type: "sqlite",
  discovery: {
    // FIXME: Figure out why MikroORM throws `ValidationError` "Only abstract
    // entities were discovered" when all entities are not abstract.
    warnWhenNoEntities: true,
  },
  entities: Object.values(Models),
  // entities: [Post],
};

export default options;
