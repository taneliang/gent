import { GentSchema } from "@elg/gent";

export default class PostSchema extends GentSchema {
  readonly fields = [
    { name: "id", type: "number", isPrimaryKey: true },
    { name: "title", type: "string" },
  ];

  readonly edges = [];
}
