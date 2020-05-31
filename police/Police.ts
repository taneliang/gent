import {
  GentQuery,
  BaseGent,
  ViewerContext,
  DangerouslyOmnipotentViewerContext,
  AuthenticatedViewerContext,
} from '..';

export type PoliceEnforceableAction = 'create' | 'read' | 'update' | 'delete';

/**
 * A decision is exactly one of the following:
 *
 * 1. `allow-unrestricted`: Allow viewer to proceed.
 * 2. `allow-restricted`: Allow viewer to proceed with a restricted view of the data.
 * 3. `deny`: Deny the viewer with a reason.
 */
export type PoliceDecision<QueryType extends GentQuery<Model>, Model extends BaseGent> =
  | { type: 'allow-unrestricted' }
  | { type: 'allow-restricted'; restrictedQuery: QueryType }
  | { type: 'deny'; reason: string };

export class PoliceNoDecisionError extends Error {
  constructor() {
    super(
      'The police did not decide on a course of action. If this is intentional, use denyAll to add a catch-all deny rule.',
    );
  }
}

/**
 * Police is a tool to describe and enforce access control rules for a
 * particular entity.
 *
 * Police authorizes a viewer context's actions, specifically
 * allow/restrict/deny create/read/update/delete of an entity.
 *
 * Police access control rules achieve 2 goals:
 *
 * 1. Perform authorization checks before a query is run .
 * 2. Provide a modified query that can only touch authorized parts of the
 *    data.
 *
 * Police is designed to be used in GentSchema to describe access control rules
 * for a particular entity. Gent will then call Police to enforce them in
 * GentQuery and GentMutator subclasses.
 */
export class Police<QueryType extends GentQuery<Model>, Model extends BaseGent> {
  readonly vc: ViewerContext;
  readonly action: PoliceEnforceableAction;
  readonly query: QueryType;

  /**
   * **WARNING:** This must be set only once so that you don't accidentally
   * override an earlier step's decision!
   */
  #decision: PoliceDecision<QueryType, Model> | undefined;

  get decision(): PoliceDecision<QueryType, Model> | undefined {
    return this.#decision;
  }

  private get decisionMade(): boolean {
    return !!this.#decision;
  }

  /**
   * Constructs a new Police instance that will decide if `vc` can perform
   * `action`.
   *
   * Note: If you're using Gent, you probably want to use the Police instance
   * provided by `GentSchema.accessControlRules` instead.
   *
   * @param vc The VC representing the actor.
   * @param action The action type to be enforced.
   */
  constructor(vc: ViewerContext, action: PoliceEnforceableAction, query: QueryType) {
    this.vc = vc;
    this.action = action;
    this.query = query;
  }

  // Action-specific rules

  onCreate(actionSpecificRules: (police: this) => this): this {
    if (this.decisionMade) return this;

    if (this.action === 'create') {
      return actionSpecificRules(this);
    }
    return this;
  }

  onRead(actionSpecificRules: (police: this) => this): this {
    if (this.decisionMade) return this;

    if (this.action === 'read') {
      return actionSpecificRules(this);
    }
    return this;
  }

  // TODO:
  // .onUpdate
  // .onDelete
  // .onCreateUpdate
  // .onCreateUpdateDelete
  // .onUpdateDelete

  onCreateUpdateDelete(actionSpecificRules: (police: this) => this): this {
    if (this.decisionMade) return this;

    if (['create', 'update', 'delete'].includes(this.action)) {
      return actionSpecificRules(this);
    }
    return this;
  }

  // Decision steps

  /**
   * Instruct police to allow the viewer to proceed if `value` is truthy.
   */
  allowIf(value: boolean): this {
    if (this.decisionMade) return this;

    if (value) {
      this.#decision = {
        type: 'allow-unrestricted',
      };
    }
    return this;
  }

  /**
   * Allows omnipotent viewer contexts to do everything.
   */
  allowIfOmnipotent(): this {
    return this.allowIf(this.vc instanceof DangerouslyOmnipotentViewerContext);
  }

  /**
   * Instruct police to allow the viewer to proceed. Intended as a catch-all
   * case.
   */
  allowAll(): this {
    return this.allowIf(true);
  }

  /**
   * Instruct police to prevent the viewer from proceeding if `value` is
   * truthy.
   */
  denyIf(value: boolean, reason: string): this {
    if (this.decisionMade) return this;

    if (value) {
      this.#decision = {
        type: 'deny',
        reason,
      };
    }
    return this;
  }

  /**
   * Instruct police to prevent the viewer from proceeding if it is
   * not authenticated.
   */
  denyIfUnauthenticated(): this {
    return this.denyIf(!(this.vc instanceof AuthenticatedViewerContext), 'Not logged in.');
  }

  /**
   * Instruct police to prevent the viewer from proceeding. Intended as a
   * catch-all case.
   */
  denyAll(reason: string): this {
    return this.denyIf(true, reason);
  }

  // TODO:
  // .denyIfViewerDoesNotHaveRole
  // .denyIfViewerDoesNotHaveScope
  // .denyIfViewerDoesNotHaveAllScopes
  // .denyIfViewerDoesNotHaveAnyScope

  /**
   * Restricts the viewer's query to an authorized part of the subgraph.
   * @param queryBuilder Creates a new restricted query.
   */
  allowWithRestrictedGraphView(
    queryBuilder: (vc: ViewerContext, query: QueryType) => QueryType,
  ): this {
    if (this.decisionMade) return this;

    this.#decision = {
      type: 'allow-restricted',
      restrictedQuery: queryBuilder(this.vc, this.query),
    };
    return this;
  }

  // Decision state enforcement

  /**
   * Enforces that the police has made a decision during its execution.
   *
   * If no decision has been reached, this method will throw
   * `PoliceNoDecisionError`.
   *
   * @throws {PoliceNoDecisionError}
   */
  throwIfNoDecision(): this {
    if (!this.decisionMade) {
      throw new PoliceNoDecisionError();
    }
    return this;
  }
}
