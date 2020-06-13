/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<<Ao2S1Bj8vM+Ysl3wEykTQaS6qlUpEa9S>>
 */

import { Collection, Entity, OneToMany, PrimaryKey, Property } from "mikro-orm";
import { GentModel } from "@elg/gent";
import { Comment } from "../Comment/Comment";

@Entity()
export class Post implements GentModel {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ nullable: true })
  description?: string;

  @OneToMany(() => Comment, (e) => e.post)
  comments = new Collection<Comment>(this);
}
