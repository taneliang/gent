/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<<b3gzbhmWEYbjO3oA47AnNbZWw4d5uBqC>>
 */

import { Entity, PrimaryKey, Property } from "mikro-orm";
import { GentModel } from "@elg/gent";

@Entity()
export class Post implements GentModel {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;
}
