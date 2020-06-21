import {
  GentSchema,
  FieldSpecification,
  EdgeSpecification,
  LifecycleObserver,
  makeUpdateTimestampUpdater,
} from "@elg/gent";
import { Comment } from "./Comment";

export default class CommentSchema extends GentSchema {
  readonly fields: FieldSpecification[] = [
    { name: "id", type: "number", primaryKey: true },
    { name: "createdAt", type: "Date", defaultDatabaseValue: "NOW()" },
    { name: "updatedAt", type: "Date", defaultDatabaseValue: "NOW()" },
    { name: "content", type: "string" },
  ];

  readonly edges: EdgeSpecification[] = [
    {
      fromMany: { inverseName: "comments" },
      toOne: { name: "post", type: "Post" },
    },
  ];

  readonly observers: LifecycleObserver<Comment>[] = [
    makeUpdateTimestampUpdater(),
  ];
}
