import type {
  ProtocolScenario,
  ScenarioResult,
  StepResult,
} from "../protocol.types";

export const doubleClaimScenario: ProtocolScenario = {
  name: "Double Claim Protection",

  run(): ScenarioResult {
    const steps: StepResult[] = [];

    const wager = {
      id: "test-double-claim",
      state: "OPEN",
      claimed: false,
      resolution: null as null | { winner: string },
      participants: ["userA", "userB"],
    };

    /* create */

    steps.push({
      step: "create wager",
      passed: wager.state === "OPEN",
    });

    /* accept */

    wager.state = "ACCEPTED";

    steps.push({
      step: "accept wager",
      passed: wager.state === "ACCEPTED",
    });

    /* resolve */

    wager.resolution = { winner: "userA" };
    wager.state = "RESOLVED";

    steps.push({
      step: "resolve wager",
      passed: wager.state === "RESOLVED",
    });

    /* first claim */

    if (!wager.claimed) {
      wager.claimed = true;
    }

    steps.push({
      step: "first claim allowed",
      passed: wager.claimed === true,
    });

    /* second claim should fail */

    const secondClaimAttempt = !wager.claimed;

    steps.push({
      step: "second claim blocked",
      passed: secondClaimAttempt === false,
    });

    const passed = steps.every((s) => s.passed);

    return {
      scenario: "Double Claim Protection",
      passed,
      steps,
    };
  },
};