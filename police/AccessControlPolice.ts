import { RoleBasedAccessController } from "./RoleBasedAccessController";
import { AccessControlPoliceReuseError } from "./AccessControlPoliceReuseError";
import { AccessControlPoliceNoDecisionError } from "./AccessControlPoliceNoDecisionError";

/**
 * A function that enforces an access control policy.
 *
 * @returns true if agent should be allowed to perform the action
 * @returns null if the policy is not applicable to the situation
 * @throws If agent should be denied from performing the action
 */
type EnforcementStep = () => Lazy<true | null>;

/**
 * Enforces role based access control policies.
 *
 * One time use only; an instance of police cannot be used to enforce more than
 * once.
 *
 * For more, see: https://en.wikipedia.org/wiki/Role-based_access_control
 */
export class AccessControlPolice<R, A> {
  /** Access controller that stores the policies to enforce. */
  #accessController: RoleBasedAccessController<R, A>;

  #steps: EnforcementStep[] = [];

  /** Whether this police has been used. */
  #enforced = false;

  constructor(accessController: RoleBasedAccessController<R, A>) {
    this.#accessController = accessController;
  }

  /**
   * Instruct police to allow the agent to proceed if `agentRole` can perform
   * `agentAction`, with `args` if provided.
   */
  allow({ if: agentRole, can: agentAction }: { if: R; can: A }, args?: Record<string, any>): this {
    this.#steps.push(async () => {
      const result = await this.#accessController.verify({ if: agentRole, can: agentAction }, args);
      return result ? true : null;
    });
    return this;
  }

  /**
   * Instruct police to disallow the agent to proceed if `value` is falsy.
   *
   * @param value Potentially-falsy value to check.
   * @param error Error that will be thrown if `value` is falsy.
   */
  denyIfFalsy(value: unknown | undefined, error: Error): this {
    this.#steps.push(() => {
      if (value) {
        return null;
      }
      throw error;
    });
    return this;
  }

  /**
   * Instruct police to disallow the agent to proceed. Intended as a catch-all
   * case.
   *
   * @param error Error that will be thrown immediately.
   */
  denyAll(error: Error): this {
    this.#steps.push(() => {
      throw error;
    });
    return this;
  }

  /**
   * Instruct police to allow the agent to proceed. Intended as a catch-all case.
   *
   * @param error Error that will be thrown immediately.
   */
  allowAll(): this {
    this.#steps.push(() => true);
    return this;
  }

  /**
   * Evaluates the accumulated list of enforcement steps.
   *
   * If any step resolves to true (i.e. allow access), the remaining steps will
   * not be executed.
   *
   * The list of steps provided must be complete, i.e. when evaluating the
   * steps, at least one must return true or at least one must throw an error.
   *
   * @throws {AccessControlPoliceReuseError}
   * @throws {AccessControlPoliceNoDecisionError}
   */
  async enforce(): Promise<void> {
    if (this.#enforced) {
      throw new AccessControlPoliceReuseError();
    }
    this.#enforced = true;

    for (const step of this.#steps) {
      if (await step()) {
        return;
      }
    }
    throw new AccessControlPoliceNoDecisionError();
  }
}
