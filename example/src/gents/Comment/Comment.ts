/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Comment/CommentSchema.ts
 *
 * @generated Codelock<<LFgXIA7EErifIAKpzVRlt6yiraGBdgHo>>
 */

import { Entity, ManyToOne, PrimaryKey, Property } from "mikro-orm";
import { GentModel } from "@elg/gent";
import { Post } from "../Post/Post";

@Entity()
export class Comment implements GentModel {
  @PrimaryKey()
  id!: number;

  @Property({ default: "NOW()" })
  createdAt!: Date;

  @Property({ default: "NOW()" })
  updatedAt!: Date;

  @Property()
  content!: string;

  @ManyToOne(() => Post, { inversedBy: "comments" })
  post!: Post;
}
