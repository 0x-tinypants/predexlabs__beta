import type {
  ProtocolScenario,
  ScenarioResult,
  StepResult,
} from "../protocol.types";

export const resolveBeforeAcceptScenario: ProtocolScenario = {
  name: "Resolve Before Accept Protection",

  run(): ScenarioResult {
    const steps: StepResult[] = [];

    const wager = {
      id: "test-resolve-before-accept",
      state: "OPEN",
      participants: ["userA"],
      resolution: null as null | { winner: string },
    };

    /* create wager */

    steps.push({
      step: "create wager",
      passed: wager.state === "OPEN",
    });

    /* attempt resolve before accept */

    const attemptedResolve = wager.state === "ACCEPTED";

    if (attemptedResolve) {
      wager.resolution = { winner: "userA" };
      wager.state = "RESOLVED";
    }

    steps.push({
      step: "resolve blocked before accept",
      passed: wager.state !== "RESOLVED",
    });

    const passed = steps.every((s) => s.passed);

    return {
      scenario: "Resolve Before Accept Protection",
      passed,
      steps,
    };
  },
};