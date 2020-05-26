import { Police } from './Police';
import { PoliceNoDecisionError } from './PoliceNoDecisionError';
import { PoliceReuseError } from './PoliceReuseError';

describe(Police, () => {
  const error = new Error('test error');

  /**
   * Convenience function to create police for tests.
   */
  const createPolice = () => new Police();

  describe(Police.prototype.enforce, () => {
    test('should enforce steps', async () => {
      await createPolice()
        .allow({ if: 'dinosaur', can: 'meow' })
        .denyIfFalsy(true, error)
        .allow({ if: 'cat', can: 'meow' }) // Expect execution to stop at this allow step
        .denyAll(new Error('catch-all error that should not be thrown'))
        .enforce();
    });

    test('should throw PoliceReuseError if enforce has been called before', async () => {
      expect.assertions(2);

      const police = createPolice();

      // Expect first call to pass
      await police.allow({ if: 'cat', can: 'meow' }).enforce();

      // Expect repeated call to enforce to throw
      try {
        await police.enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(PoliceReuseError);
      }

      // Expect enforce to throw even if enforcement steps are added
      try {
        await police.allow({ if: 'cat', can: 'meow' }).enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(PoliceReuseError);
      }
    });

    test('should throw PoliceNoDecisionError if no enforcement step allows or denies the agent', async () => {
      expect.assertions(3);

      // No steps
      try {
        await createPolice().enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(PoliceNoDecisionError);
      }

      // At least one allow step was present but passed through
      try {
        await createPolice().allow({ if: 'dinosaur', can: 'meow' }).enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(PoliceNoDecisionError);
      }

      // At least one deny step was present but passed through
      try {
        await createPolice().denyIfFalsy(true, error).enforce();
      } catch (e) {
        expect(e).toBeInstanceOf(PoliceNoDecisionError);
      }
    });
  });

  describe('enforcement steps', () => {
    describe(Police.prototype.allow, () => {
      test('should allow agent to proceed if a policy returns true', async () => {
        await createPolice().allow({ if: 'cat', can: 'meow' }).enforce();
      });

      test('should passthrough if no policy returns true', async () => {
        expect.assertions(1);
        try {
          await createPolice().allow({ if: 'dinosaur', can: 'meow' }).enforce();
        } catch (e) {
          expect(e).toBeInstanceOf(PoliceNoDecisionError);
        }
      });
    });

    describe(Police.prototype.denyIfFalsy, () => {
      test('should deny agent from proceeding if value is falsy', async () => {
        expect.assertions(1);
        try {
          await createPolice().denyIfFalsy(false, error).enforce();
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      test('should passthrough if value is truthy', async () => {
        expect.assertions(1);
        try {
          await createPolice().denyIfFalsy(true, error).enforce();
        } catch (e) {
          expect(e).toBeInstanceOf(PoliceNoDecisionError);
        }
      });
    });

    describe(Police.prototype.denyAll, () => {
      test('should deny agent from proceeding', async () => {
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
