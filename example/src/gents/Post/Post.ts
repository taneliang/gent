/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<<M523kKzRY1YXdcatkZ94HOq7KM8e4ZpR>>
 */

import { Entity, PrimaryKey, Property } from "mikro-orm";
import { GentModel } from "@elg/gent";

@Entity()
export class Post implements GentModel {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ nullable: true })
  description?: string;
}
