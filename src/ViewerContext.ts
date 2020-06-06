import { EntityManager } from "mikro-orm";
import { createContextualizedEntityManager } from "./orm";
import { BeltalowdaCenter } from "./BeltalowdaCenter";

/**
 * Encapulates all information for a viewer in one request. Commonly
 * abbreviated to `vc` or "VC".
 *
 * A new VC must be created for each viewer, and a new one should be created
 * for every request.
 */
export abstract class ViewerContext {
  /**
   * Entity manager, forked meant to be used with this viewer context.
   *
   * WARNING: You probably don't want to use this directly! This is intended
   * for use by GentQuery/GentMutator and has raw access to the database. Using
   * this will bypass all Gent authorization checks. Use GentQuery/GentMutator
   * if possible.
   */
  readonly entityManager: EntityManager;

  readonly beltalowdas: BeltalowdaCenter;

  constructor() {
    this.entityManager = createContextualizedEntityManager();
    this.beltalowdas = new BeltalowdaCenter();
  }

  abstract get isAuthenticated(): boolean;
}

/**
 * A viewer context for an authenticated viewer.
 */
export abstract class AuthenticatedViewerContext extends ViewerContext {
  readonly isAuthenticated = true;
}

/**
 * A viewer context for a viewer that is not logged in.
 */
export class UnauthenticatedViewerContext extends ViewerContext {
  readonly isAuthenticated = false;
}

/**
 * Omniscient, omnipotent viewer context that can see and do everything.
 * **Dangerous!** Bypasses all authorization checks. Use only when necessary.
 */
export class DangerouslyOmnipotentViewerContext extends AuthenticatedViewerContext {}
