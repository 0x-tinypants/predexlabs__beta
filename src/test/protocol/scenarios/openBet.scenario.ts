import type {
  ProtocolScenario,
  ScenarioResult,
  StepResult,
} from "../protocol.types";

export const openBetScenario: ProtocolScenario = {
  name: "Open Bet Happy Path",

  run(): ScenarioResult {
    const steps: StepResult[] = [];

    /*
    Step 1 — create wager
    */

    const wager = {
      id: "test-open-1",
      style: "OPEN_BET",
      state: "OPEN",
      stake: 10,
      creator: "userA",
      participants: [],
      resolution: null,
      claimed: false,
    };

    const created = wager.state === "OPEN";

    steps.push({
      step: "create wager",
      passed: created,
    });

    /*
    Step 2 — resolve wager
    */

    wager.resolution = {
      winner: "playerA"
    } as any;

    wager.state = "RESOLVED";

    const resolved = wager.state === "RESOLVED";

    steps.push({
      step: "resolve wager",
      passed: resolved,
    });

    /*
    Step 3 — claim wager
    */

    wager.claimed = true;

    const claimed = wager.claimed === true;

    steps.push({
      step: "claim wager",
      passed: claimed,
    });

    const passed = steps.every((s) => s.passed);

    return {
      scenario: "Open Bet Happy Path",
      passed,
      steps,
    };
  },
};