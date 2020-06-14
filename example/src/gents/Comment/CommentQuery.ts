/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Comment/CommentSchema.ts
 *
 * @generated Codelock<<D/2v8TgZe0QCA8rPn2ZkPcmb9DhZ7DRF>>
 */

import {
  GentQuery,
  GentQueryGraphViewRestricter,
  Police,
  ViewerContext,
} from "@elg/gent";
import { Comment } from "./Comment";
import { CommentMutator } from "./CommentMutator";
import CommentSchema from "./CommentSchema";
import { EntityData } from "mikro-orm";
import { uniq } from "lodash";
import { PostQuery } from "../Post/PostQuery";

export class CommentQuery extends GentQuery<Comment> {
  protected entityClass = Comment;

  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentQueryGraphViewRestricter<CommentQuery>
      | undefined = undefined,
    shouldApplyAccessControlRules = true
  ) {
    super(vc, Comment, graphViewRestrictor, shouldApplyAccessControlRules);
  }

  protected applyAccessControlRules(): void {
    const authorizedSubviewQuery = new CommentQuery(this.vc, undefined, false);
    const police = new Police<CommentQuery, Comment>(
      this.vc,
      "read",
      authorizedSubviewQuery
    ).allowIfOmnipotent();
    CommentSchema.accessControlRules(police);
    police.throwIfNoDecision();

    if (police.decision?.type === "deny") {
      throw new Error(
        `Not allowed to query Comment. Reason: "${police.decision.reason}"`
      );
    } else if (police.decision?.type === "allow-restricted") {
      this.queryBuilder.with(
        "comment",
        this.queryBuilder.client.raw(
          police.decision.restrictedQuery.queryBuilder.toQuery()
        )
      );
    }
  }

  mutate(): CommentMutator {
    return new CommentMutator(
      this.vc,
      async (_childMutator, knexQueryBuilder) => {
        knexQueryBuilder.whereIn("id", await this.getIds());
      }
    );
  }

  whereIdEquals(value: number): this {
    this.queryBuilder.where("id", value);
    return this;
  }

  whereIdIn(values: number[]): this {
    this.queryBuilder.whereIn("id", values);
    return this;
  }

  async getIds(): Promise<number[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder.clone().clearSelect().select("id");
    const results: EntityData<
      Comment
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return resultEntities.map((gent) => gent.id);
  }

  whereContentLike(pattern: string): this {
    this.queryBuilder.where("content", "LIKE", pattern);
    return this;
  }

  whereContentEquals(value: string): this {
    this.queryBuilder.where("content", value);
    return this;
  }

  whereContentIn(values: string[]): this {
    this.queryBuilder.whereIn("content", values);
    return this;
  }

  async getContents(): Promise<string[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder.clone().clearSelect().select("content");
    const results: EntityData<
      Comment
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return resultEntities.map((gent) => gent.content);
  }

  wherePostIdIn(ids: number[]): this {
    this.queryBuilder.whereIn("post_id", ids);
    return this;
  }

  whereHasPost(
    builder: (query: PostQuery) => PostQuery = (query) => query
  ): this {
    const relationQuery = builder(new PostQuery(this.vc));
    this.queryBuilder.whereExists(
      relationQuery.queryBuilder.where(
        "comment.post_id",
        relationQuery.queryBuilder.client.ref("post.id")
      )
    );
    return this;
  }

  queryPost(): PostQuery {
    return new PostQuery(this.vc, async (childQuery) => {
      childQuery.whereIdIn(await this.getPostIds());
    });
  }

  async getPostIds(): Promise<number[]> {
    const finalQb = this.queryBuilder
      .clone()
      .clearSelect()
      .select("id", "post_id");
    const results: EntityData<
      Comment
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const relatedEntitiesWithIds = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return uniq(relatedEntitiesWithIds.flatMap((gent) => gent.post.id));
  }
}
