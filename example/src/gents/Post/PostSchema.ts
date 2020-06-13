import { GentSchema, FieldSpecification, EdgeSpecification } from "@elg/gent";

export default class PostSchema extends GentSchema {
  readonly fields: FieldSpecification[] = [
    { name: "id", type: "number", isPrimaryKey: true },
    { name: "title", type: "string" },
    { name: "description", type: "string", nullable: true },
  ];

  readonly edges: EdgeSpecification[] = [];
}
