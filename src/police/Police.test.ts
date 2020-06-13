import {
  Police,
  PoliceNoDecisionError,
  PoliceDecision,
  PoliceEnforceableAction,
  policeEnforceableActions,
} from "./Police";
import {
  DangerouslyOmnipotentViewerContext,
  ViewerContext,
  UnauthenticatedViewerContext,
} from "..";
import {
  closeGlobalOrmConnection,
  initTestOrm,
  TestEntityQuery,
  TestEntity,
  TestAuthenticatedViewerContext,
  createContextualizedEntityManager,
} from "../test-util";

describe(Police, () => {
  type TestPolice = Police<TestEntityQuery, TestEntity>;
  type TestPoliceDecision = PoliceDecision<TestEntityQuery, TestEntity>;

  beforeAll(async () => await initTestOrm());
  afterAll(async () => await closeGlobalOrmConnection());

  /**
   * Convenience function to instantiate a new Police instance and its
   * dependencies.
   */
  function createPolice(
    vc: ViewerContext | undefined = undefined,
    action: PoliceEnforceableAction = "read"
  ): { vc: ViewerContext; query: TestEntityQuery; police: TestPolice } {
    vc =
      vc ??
      new DangerouslyOmnipotentViewerContext(
        createContextualizedEntityManager()
      );
    const query = new TestEntityQuery(vc, TestEntity);
    const police = new Police(vc, action, query);
    return { vc, police, query };
  }

  /**
   * Test that a method does not change the decision if one has already been
   * made. This variant sets `decision` to deny, and is intended to test
   * `allow*` deciding methods.
   *
   * @param policeRunner A callback function that takes in a police with
   * decision set to deny and calls the deciding method being tested.
   * @param vcConstructor A callback function that, if not undefined, should
   * produce a new VC.
   * @see testShouldDoNothingIfAlreadyDecidedToAllow
   */
  function testShouldDoNothingIfAlreadyDecidedToDeny(
    policeRunner: (police: TestPolice) => TestPolice,
    vcConstructor: (() => ViewerContext) | undefined = undefined
  ) {
    test("should do nothing if a decision (deny) has been made", () => {
      expect(
        policeRunner(
          createPolice(
            vcConstructor ? vcConstructor() : undefined
          ).police.denyAll("reason")
        ).decision
      ).toEqual<TestPoliceDecision>({
        type: "deny",
        reason: "reason",
      });
    });
  }

  /**
   * Test that a method does not change the decision if one has already been
   * made. This variant sets `decision` to allow-unrestricted, and is intended
   * to test `deny*` deciding methods.
   *
   * @param policeRunner A callback function that takes in a police with
   * decision set to allow-unrestricted and calls the deciding method being
   * tested.
   * @param vcConstructor A callback function that, if not undefined, should
   * produce a new VC.
   * @see testShouldDoNothingIfAlreadyDecidedToDeny
   */
  function testShouldDoNothingIfAlreadyDecidedToAllow(
    policeRunner: (police: TestPolice) => TestPolice,
    vcConstructor: (() => ViewerContext) | undefined = undefined
  ) {
    test("should do nothing if a decision (allow) has been made", () => {
      expect(
        policeRunner(
          createPolice(
            vcConstructor ? vcConstructor() : undefined
          ).police.allowAll()
        ).decision
      ).toEqual<TestPoliceDecision>({
        type: "allow-unrestricted",
      });
    });
  }

  /**
   * Convenience test to ensure that fluent methods return the same `Police`
   * instance they were invoked on.
   * @param policeRunner A callback function that should call the method being
   * tested.
   */
  function testShouldReturnSelf(
    policeRunner: (police: TestPolice) => TestPolice
  ) {
    test("should return self", () => {
      const police = createPolice().police;
      expect(policeRunner(police)).toBe(police);
    });
  }

  describe(Police.prototype.constructor, () => {
    test("should construct police with no decision", () => {
      const { police } = createPolice();
      expect(police.decision).toBeUndefined();
    });
  });

  describe("action-specific rules", () => {
    function testShouldInvokeCallbackOnlyOnActions(
      actions: PoliceEnforceableAction[],
      policeRunner: (
        police: TestPolice,
        mockActionSpecificRulesCallback: jest.Mock
      ) => TestPolice
    ) {
      policeEnforceableActions.forEach((action) => {
        if (actions.includes(action)) {
          test(`should invoke callback on ${action} action`, () => {
            const mockActionSpecificRulesCallback = jest
              .fn()
              .mockImplementation((police) => police);
            const police = policeRunner(
              createPolice(undefined, action).police,
              mockActionSpecificRulesCallback
            );
            expect(mockActionSpecificRulesCallback).toHaveBeenCalledTimes(1);
            expect(mockActionSpecificRulesCallback).toHaveBeenCalledWith(
              police
            );
          });

          test(`should not invoke callback on ${action} action if decision has been made`, () => {
            const mockActionSpecificRulesCallback = jest.fn();
            policeRunner(
              createPolice(undefined, action).police.allowAll(),
              mockActionSpecificRulesCallback
            );
            expect(mockActionSpecificRulesCallback).not.toHaveBeenCalled();
          });
        } else {
          test(`should not invoke callback on ${action} action`, () => {
            const mockActionSpecificRulesCallback = jest.fn();
            policeRunner(
              createPolice(undefined, action).police,
              mockActionSpecificRulesCallback
            );
            expect(mockActionSpecificRulesCallback).not.toHaveBeenCalled();
          });
        }
      });
    }

    describe(Police.prototype.onCreate, () => {
      testShouldReturnSelf((police) => police.onCreate((police) => police));
      testShouldInvokeCallbackOnlyOnActions(
        ["create"],
        (police, mockCallback) => police.onCreate(mockCallback)
      );
    });

    describe(Police.prototype.onRead, () => {
      testShouldReturnSelf((police) => police.onRead((police) => police));
      testShouldInvokeCallbackOnlyOnActions(["read"], (police, mockCallback) =>
        police.onRead(mockCallback)
      );
    });

    describe(Police.prototype.onCreateUpdateDelete, () => {
      testShouldReturnSelf((police) =>
        police.onCreateUpdateDelete((police) => police)
      );
      testShouldInvokeCallbackOnlyOnActions(
        ["create", "update", "delete"],
        (police, mockCallback) => police.onCreateUpdateDelete(mockCallback)
      );
    });
  });

  describe("decision steps", () => {
    describe(Police.prototype.allowIf, () => {
      testShouldReturnSelf((police) => police.allowIf(false));
      testShouldDoNothingIfAlreadyDecidedToDeny((police) =>
        police.allowIf(true)
      );

      test("should allow if true", () => {
        expect(createPolice().police.allowIf(true).decision).toEqual<
          TestPoliceDecision
        >({
          type: "allow-unrestricted",
        });
      });

      test("should do nothing if false", () => {
        expect(createPolice().police.allowIf(false).decision).toBeUndefined();
      });
    });

    describe(Police.prototype.allowIfOmnipotent, () => {
      testShouldReturnSelf((police) => police.allowIfOmnipotent());
      testShouldDoNothingIfAlreadyDecidedToDeny(
        (police) => police.allowIfOmnipotent(),
        () =>
          new DangerouslyOmnipotentViewerContext(
            createContextualizedEntityManager()
          )
      );

      test("should allow if VC is omnipotent", () => {
        expect(
          createPolice(
            new DangerouslyOmnipotentViewerContext(
              createContextualizedEntityManager()
            )
          ).police.allowIfOmnipotent().decision
        ).toEqual<TestPoliceDecision>({
          type: "allow-unrestricted",
        });
      });

      test("should do nothing if VC is not omnipotent", () => {
        expect(
          createPolice(
            new TestAuthenticatedViewerContext(
              createContextualizedEntityManager()
            )
          ).police.allowIfOmnipotent().decision
        ).toBeUndefined();
        expect(
          createPolice(
            new UnauthenticatedViewerContext(
              createContextualizedEntityManager()
            )
          ).police.allowIfOmnipotent().decision
        ).toBeUndefined();
      });
    });

    describe(Police.prototype.allowAll, () => {
      testShouldReturnSelf((police) => police.allowAll());
      testShouldDoNothingIfAlreadyDecidedToDeny(
        (police) => police.allowAll(),
        () =>
          new DangerouslyOmnipotentViewerContext(
            createContextualizedEntityManager()
          )
      );

      test("should set decision to allow", () => {
        const police = createPolice().police.allowAll();
        expect(police.decision).toEqual<TestPoliceDecision>({
          type: "allow-unrestricted",
        });
      });
    });

    describe(Police.prototype.denyIf, () => {
      testShouldReturnSelf((police) => police.denyIf(true, "some reason"));
      testShouldReturnSelf((police) => police.denyIf(false, "some reason"));
      testShouldDoNothingIfAlreadyDecidedToAllow((police) =>
        police.denyIf(true, "should not appear")
      );

      test("should deny if true", () => {
        const reason = "deny reason";
        expect(createPolice().police.denyIf(true, reason).decision).toEqual<
          TestPoliceDecision
        >({
          type: "deny",
          reason,
        });
      });

      test("should do nothing if false", () => {
        expect(
          createPolice().police.denyIf(false, "should not appear").decision
        ).toBeUndefined();
      });
    });

    describe(Police.prototype.denyIfUnauthenticated, () => {
      testShouldReturnSelf((police) => police.denyIfUnauthenticated());
      testShouldDoNothingIfAlreadyDecidedToAllow(
        (police) => police.denyIfUnauthenticated(),
        () =>
          new UnauthenticatedViewerContext(createContextualizedEntityManager())
      );

      test("should deny if unauthenticated", () => {
        expect(
          createPolice(
            new UnauthenticatedViewerContext(
              createContextualizedEntityManager()
            )
          ).police.denyIfUnauthenticated().decision
        ).toMatchObject({
          type: "deny",
        });
      });

      test("should do nothing if authenticated or omnipotent", () => {
        expect(
          createPolice(
            new TestAuthenticatedViewerContext(
              createContextualizedEntityManager()
            )
          ).police.denyIfUnauthenticated().decision
        ).toBeUndefined();
        expect(
          createPolice(
            new DangerouslyOmnipotentViewerContext(
              createContextualizedEntityManager()
            )
          ).police.denyIfUnauthenticated().decision
        ).toBeUndefined();
      });
    });

    describe(Police.prototype.denyAll, () => {
      testShouldReturnSelf((police) => police.denyAll("no go"));
      testShouldDoNothingIfAlreadyDecidedToAllow((police) =>
        police.denyAll("should not appear")
      );

      test("should set decision to deny", () => {
        const reason = "some reason";
        const police = createPolice().police.denyAll(reason);
        expect(police.decision).toEqual<TestPoliceDecision>({
          type: "deny",
          reason,
        });
      });
    });

    describe(Police.prototype.allowWithRestrictedGraphView, () => {
      testShouldReturnSelf((police) =>
        police.allowIf(true).throwIfNoDecision()
      );

      test("should call callback with own vc and query", () => {
        const { vc: omniVc, police, query } = createPolice();
        const mockCallback = jest.fn().mockImplementation((_vc, q) => q);
        police.allowWithRestrictedGraphView(mockCallback);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(omniVc, query);
      });

      test("should set decision", () => {
        const { police, query } = createPolice();
        police.allowWithRestrictedGraphView((_vc, q) => q);
        expect(police.decision).toEqual<TestPoliceDecision>({
          type: "allow-restricted",
          restrictedQuery: query,
        });
      });

      test("should do nothing if a decision has been made to allow", () => {
        const mockCallback = jest.fn();
        createPolice()
          .police.allowAll()
          .allowWithRestrictedGraphView(mockCallback);
        expect(mockCallback).not.toHaveBeenCalled();
      });

      test("should do nothing if a decision has been made to deny", () => {
        const mockCallback = jest.fn();
        createPolice()
          .police.denyAll("should not appear")
          .allowWithRestrictedGraphView(mockCallback);
        expect(mockCallback).not.toHaveBeenCalled();
      });
    });
  });

  describe(Police.prototype.throwIfNoDecision, () => {
    test("should throw PoliceNoDecisionError if no decision was made", () => {
      // On construction
      expect(() => createPolice().police.throwIfNoDecision()).toThrow(
        PoliceNoDecisionError
      );

      // With steps that did not decide
      expect(() =>
        createPolice()
          .police.allowIf(false)
          .denyIf(false, "... just no")
          .throwIfNoDecision()
      ).toThrow(PoliceNoDecisionError);
    });

    test("should not throw PoliceNoDecisionError if a decision was made", () => {
      expect(() =>
        createPolice()
          .police.allowIf(true)
          .denyIf(false, "... just no")
          .throwIfNoDecision()
      ).not.toThrow(PoliceNoDecisionError);

      expect(() =>
        createPolice()
          .police.allowIf(false)
          .denyIf(true, "... just no")
          .throwIfNoDecision()
      ).not.toThrow(PoliceNoDecisionError);

      expect(() =>
        createPolice()
          .police.allowWithRestrictedGraphView((_vc, query) => query)
          .throwIfNoDecision()
      ).not.toThrow(PoliceNoDecisionError);
    });

    testShouldReturnSelf((police) => police.allowIf(true).throwIfNoDecision());
  });
});
