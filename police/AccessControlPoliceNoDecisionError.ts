import { multiline } from "@utils/multiline";

export class AccessControlPoliceNoDecisionError extends Error {
  constructor() {
    super(multiline`
      The police did not decide on a course of action because there were no
      enforcement steps that either allowed or denied the agent. If this is
      intentional, use denyAll to add a catch-all deny enforcement step.
    `);
  }
}
