/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Comment/CommentSchema.ts
 *
 * @generated Codelock<<E4YwW1O1WihxNRYHYVbD6xCh4lF5GuhZ>>
 */

import { QueryBuilder } from "knex";
import {
  GentMutator,
  GentMutatorGraphViewRestricter,
  LifecycleObserver,
  MutationAction,
  Police,
  ViewerContext,
} from "@elg/gent";
import { Comment } from "./Comment";
import { CommentQuery } from "./CommentQuery";
import CommentSchema from "./CommentSchema";

export class CommentMutator extends GentMutator<Comment> {
  protected readonly lifecycleObservers: LifecycleObserver<
    Comment
  >[] = new CommentSchema().observers;

  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentMutatorGraphViewRestricter<CommentMutator>
      | undefined = undefined
  ) {
    super(vc, Comment, graphViewRestrictor);
  }

  static fromEntities(vc: ViewerContext, entities: Comment[]): CommentMutator {
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
    const authorizedSubviewQuery = new CommentQuery(this.vc, undefined, false);
    const police = new Police<CommentQuery, Comment>(
      this.vc,
      action,
      authorizedSubviewQuery
    ).allowIfOmnipotent();
    CommentSchema.accessControlRules(police);
    police.throwIfNoDecision();

    if (police.decision?.type === "deny") {
      throw new Error(
        `Not allowed to query Comment. Reason: "${police.decision.reason}"`
      );
    } else if (police.decision?.type === "allow-restricted") {
      knexQueryBuilder.whereIn(
        "id",
        police.decision.restrictedQuery.queryBuilder.clearSelect().select("id")
      );
    }
  }
}
