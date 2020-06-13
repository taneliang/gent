/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Comment/CommentSchema.ts
 *
 * @generated Codelock<<uZXLMt0snDPIktIvEVkH7zi9tariHRp0>>
 */

import { Entity, ManyToOne, PrimaryKey, Property } from "mikro-orm";
import { GentModel } from "@elg/gent";
import { Post } from "../Post/Post";

@Entity()
export class Comment implements GentModel {
  @PrimaryKey()
  id!: number;

  @Property()
  content!: string;

  @ManyToOne(() => Post, { inversedBy: "comments" })
  post!: Post;
}
