export class PoliceNoDecisionError extends Error {
  constructor() {
    super(
      'The police did not decide on a course of action because there were no enforcement steps that either allowed or denied the agent. If this is intentional, use denyAll to add a catch-all deny enforcement step.',
    );
  }
}
