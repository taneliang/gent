/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<<ZcYMZj6wVCbPRmpXn91VjeSYfUTKaLjv>>
 */

import {
  Beltalowda,
  GentLoader,
  GentLoaderGraphViewRestricter,
  ViewerContext,
} from "@elg/gent";
import { Post } from "./Post";
import { PostQuery } from "./PostQuery";

export class PostLoader extends GentLoader<Post> {
  protected entityClass = Post;

  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentLoaderGraphViewRestricter<PostLoader>
      | undefined = undefined
  ) {
    super(vc, graphViewRestrictor);
  }

  protected createIdBeltalowda(): Beltalowda<Post, number> {
    return new Beltalowda(
      this.vc,
      () => new PostQuery(this.vc),
      "id",
      (model) => model.id
    );
  }
}
