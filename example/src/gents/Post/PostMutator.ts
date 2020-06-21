/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<</UB1UcdiioQl2FFzUgsRgYklmEpknrTJ>>
 */

import { QueryBuilder } from "knex";
import {
  GentMutator,
  GentMutatorGraphViewRestricter,
  MutationAction,
  Police,
  ViewerContext,
} from "@elg/gent";
import { Post } from "./Post";
import { PostQuery } from "./PostQuery";
import PostSchema from "./PostSchema";

export class PostMutator extends GentMutator<Post> {
  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentMutatorGraphViewRestricter<PostMutator>
      | undefined = undefined
  ) {
    super(vc, Post, graphViewRestrictor);
  }

  static fromEntities(vc: ViewerContext, entities: Post[]): PostMutator {
    return new this(vc, (_childMutator, knexQueryBuilder) => {
      knexQueryBuilder.whereIn(
        "id",
        entities.map((entity) => entity.id)
      );
    });
  }

  protected applyAccessControlRules(
    action: MutationAction,
    knexQueryBuilder: QueryBuilder
  ): void {
    const authorizedSubviewQuery = new PostQuery(this.vc, undefined, false);
    const police = new Police<PostQuery, Post>(
      this.vc,
      action,
      authorizedSubviewQuery
    ).allowIfOmnipotent();
    PostSchema.accessControlRules(police);
    police.throwIfNoDecision();

    if (police.decision?.type === "deny") {
      throw new Error(
        `Not allowed to query Post. Reason: "${police.decision.reason}"`
      );
    } else if (police.decision?.type === "allow-restricted") {
      knexQueryBuilder.whereIn(
        "id",
        police.decision.restrictedQuery.queryBuilder.clearSelect().select("id")
      );
    }
  }
}
