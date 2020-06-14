import { GentSchema, FieldSpecification, EdgeSpecification } from "@elg/gent";

export default class CommentSchema extends GentSchema {
  readonly fields: FieldSpecification[] = [
    { name: "id", type: "number", primaryKey: true },
    { name: "content", type: "string" },
  ];

  readonly edges: EdgeSpecification[] = [
    {
      fromMany: { inverseName: "comments" },
      toOne: { name: "post", type: "Post" },
    },
  ];
}
