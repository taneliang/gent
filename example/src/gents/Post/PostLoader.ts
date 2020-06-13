/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<<eSQN1TpiXMEQ2keQXRAyCf7ciJGlSISg>>
 */

import {
  Beltalowda,
  GentLoader,
  GentLoaderGraphViewRestricter,
  ViewerContext,
} from "@elg/gent";
import { Post } from "./Post";
import { PostQuery } from "./PostQuery";
import { Comment } from "../Comment/Comment";
import { CommentLoader } from "../Comment/CommentLoader";
import { CommentQuery } from "../Comment/CommentQuery";

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

  loadComments(): CommentLoader {
    return new CommentLoader(this.vc, async (childLoader) => {
      const entitiesOrErrors = await this.getComments();
      const entityIds = entitiesOrErrors
        // TODO: Handle errors better
        .filter((entitiesOrError) => entitiesOrError instanceof Array)
        .flatMap((entities) => entities as Comment[])
        .map((entity) => entity.id);
      childLoader.onlyIds(entityIds);
    });
  }

  async getComments(): Promise<(Comment[] | Error)[]> {
    return this.vc.beltalowdas
      .beltalowdaForModel(Comment, "post_id", () => {
        return new Beltalowda(
          this.vc,
          () => new CommentQuery(this.vc),
          "post_id",
          (model) => model.post.id
        );
      })
      .loadManyWithManyEntitiesEach(this.ids);
  }
}
