/**
 * This file is generated. Do not modify it manually.
 *
 * Regenerate this file by running:
 * gentgen generate src/gents/Post/PostSchema.ts
 *
 * @generated Codelock<<gQEw5DFrM9935B29j1fxk57Xp9WkwJag>>
 */

import {
  GentQuery,
  GentQueryGraphViewRestricter,
  Police,
  ViewerContext,
} from "@elg/gent";
import { Post } from "./Post";
import { PostMutator } from "./PostMutator";
import PostSchema from "./PostSchema";
import { EntityData } from "mikro-orm";

export class PostQuery extends GentQuery<Post> {
  protected entityClass = Post;

  constructor(
    vc: ViewerContext,
    graphViewRestrictor:
      | GentQueryGraphViewRestricter<PostQuery>
      | undefined = undefined,
    shouldApplyAccessControlRules = true
  ) {
    super(vc, Post, graphViewRestrictor, shouldApplyAccessControlRules);
  }

  protected applyAccessControlRules(): void {
    const authorizedSubviewQuery = new PostQuery(this.vc, undefined, false);
    const police = new Police<PostQuery, Post>(
      this.vc,
      "read",
      authorizedSubviewQuery
    ).allowIfOmnipotent();
    PostSchema.accessControlRules(police);
    police.throwIfNoDecision();

    if (police.decision?.type === "deny") {
      throw new Error(
        `Not allowed to query Post. Reason: "${police.decision.reason}"`
      );
    } else if (police.decision?.type === "allow-restricted") {
      this.queryBuilder.with(
        "post",
        this.queryBuilder.client.raw(
          police.decision.restrictedQuery.queryBuilder.toQuery()
        )
      );
    }
  }

  mutate(): PostMutator {
    return new PostMutator(this.vc, async (_childMutator, knexQueryBuilder) => {
      knexQueryBuilder.whereIn("id", await this.getIds());
    });
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
      Post
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return resultEntities.map((gent) => gent.id);
  }

  whereTitleLike(pattern: string): this {
    this.queryBuilder.where("title", "LIKE", pattern);
    return this;
  }

  whereTitleEquals(value: string): this {
    this.queryBuilder.where("title", value);
    return this;
  }

  whereTitleIn(values: string[]): this {
    this.queryBuilder.whereIn("title", values);
    return this;
  }

  async getTitles(): Promise<string[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder.clone().clearSelect().select("title");
    const results: EntityData<
      Post
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return resultEntities.map((gent) => gent.title);
  }

  whereDescriptionLike(pattern: string): this {
    this.queryBuilder.where("description", "LIKE", pattern);
    return this;
  }

  whereDescriptionEquals(value: string): this {
    this.queryBuilder.where("description", value);
    return this;
  }

  whereDescriptionIn(values: string[]): this {
    this.queryBuilder.whereIn("description", values);
    return this;
  }

  whereDescriptionIsNull(): this {
    this.queryBuilder.whereNull("description");
    return this;
  }

  whereDescriptionIsNotNull(): this {
    this.queryBuilder.whereNotNull("description");
    return this;
  }

  async getDescriptions(): Promise<(string | undefined)[]> {
    await this.applyGraphViewRestrictions();
    const finalQb = this.queryBuilder
      .clone()
      .clearSelect()
      .select("description");
    const results: EntityData<
      Post
    >[] = await this.vc.entityManager
      .getConnection("read")
      .execute(finalQb as never);
    const resultEntities = results.map((result) =>
      this.vc.entityManager.map(this.entityClass, result)
    );
    return resultEntities.map((gent) => gent.description);
  }
}
