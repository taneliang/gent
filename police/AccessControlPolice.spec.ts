import { AccessControlPolice } from "./AccessControlPolice";
import { RoleBasedAccessController } from "./RoleBasedAccessController";
import { AccessControlPoliceNoDecisionError } from "./AccessControlPoliceNoDecisionError";
import { AccessControlPoliceReuseError } from "./AccessControlPoliceReuseError";

describe(AccessControlPolice, () => {
  type Action = "meow";
  type Role = "cat" | "dinosaur";
  const rbac = new RoleBasedAccessController<Role, Action>([{ a: "cat", can: "meow" }]);

  const error = new Error("test error");

  /**
   * Convenience function to create police for tests.
   */
  const createPolice = () => new AccessControlPolice<Role, Action>(rbac);

  describe("enforce", () => {
    it("should enforce steps", async () => {
      await createPolice()
        .allow({ if: "dinosaur", can: "meow" })
        .denyIfFalsy(true, error)
        .allow({ if: "cat", can: "meow" }) // Expect execution to stop at this allow step
        .denyAll(new Error("catch-all error that should not be thrown"))
        .enforce();
    });

    it("should throw AccessControlPoliceReuseError if enforce has been called before", async () => {
      expect.assertions(2);

      const police = createPolice();

      // Expect first call to pass
      await police.allow({ if: "cat", can: "meow" }).enforce();

      // Expect repeated call to enforce to throw
      try {
        await police.enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(AccessControlPoliceReuseError);
      }

      // Expect enforce to throw even if enforcement steps are added
      try {
        await police.allow({ if: "cat", can: "meow" }).enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(AccessControlPoliceReuseError);
      }
    });

    it("should throw AccessControlPoliceNoDecisionError if no enforcement step allows or denies the agent", async () => {
      expect.assertions(3);

      // No steps
      try {
        await createPolice().enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(AccessControlPoliceNoDecisionError);
      }

      // At least one allow step was present but passed through
      try {
        await createPolice().allow({ if: "dinosaur", can: "meow" }).enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(AccessControlPoliceNoDecisionError);
      }

      // At least one deny step was present but passed through
      try {
        await createPolice().denyIfFalsy(true, error).enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(AccessControlPoliceNoDecisionError);
      }
    });
  });

  describe("enforcement steps", () => {
    describe("allow", () => {
      it("should allow agent to proceed if a policy returns true", async () => {
        await createPolice().allow({ if: "cat", can: "meow" }).enforce();
      });

      it("should passthrough if no policy returns true", async () => {
        expect.assertions(1);
        try {
          await createPolice().allow({ if: "dinosaur", can: "meow" }).enforce();
        } catch (e) {
          expect(e).toBeInstanceOf(AccessControlPoliceNoDecisionError);
        }
      });
    });

    describe("denyIfFalsy", () => {
      it("should deny agent from proceeding if value is falsy", async () => {
        expect.assertions(1);
        try {
          await createPolice().denyIfFalsy(false, error).enforce();
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      it("should passthrough if value is truthy", async () => {
        expect.assertions(1);
        try {
          await createPolice().denyIfFalsy(true, error).enforce();
        } catch (e) {
          expect(e).toBeInstanceOf(AccessControlPoliceNoDecisionError);
        }
      });
    });

    describe("denyAll", () => {
      it("should deny agent from proceeding", async () => {
        expect.assertions(1);
        try {
          await createPolice().denyAll(error).enforce();
        } catch (e) {
          expect(e).toBe(error);
        }
      });
    });
  });
});
