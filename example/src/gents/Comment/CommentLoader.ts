/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Comment/CommentSchema.ts
 *
 * @generated Codelock<<N7qeS0ZkHAm2sxuDSbCDtfzzL10mJ/yr>>
 */

import {
  Beltalowda,
  GentLoader,
  GentLoaderGraphViewRestricter,
  ViewerContext,
} from "@elg/gent";
import { Comment } from "./Comment";
import { CommentQuery } from "./CommentQuery";
import { PostLoader } from "../Post/PostLoader";

export class CommentLoader extends GentLoader<Comment> {
  protected entityClass = Comment;

  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentLoaderGraphViewRestricter<CommentLoader>
      | undefined = undefined
  ) {
    super(vc, graphViewRestrictor);
  }

  protected createIdBeltalowda(): Beltalowda<Comment, number> {
    return new Beltalowda(
      this.vc,
      () => new CommentQuery(this.vc),
      "id",
      (model) => model.id
    );
  }

  loadPost(): PostLoader {
    return new PostLoader(this.vc, async (childLoader) => {
      const selves = await this.getAll();
      childLoader.onlyIds(
        selves
          // TODO: Handle errors better
          .map((self) => (self instanceof Error ? undefined : self?.post.id))
          .filter((self) => self !== undefined) as number[]
      );
    });
  }
}
