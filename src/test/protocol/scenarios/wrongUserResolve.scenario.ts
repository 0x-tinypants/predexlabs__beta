import type {
  ProtocolScenario,
  ScenarioResult,
  StepResult,
} from "../protocol.types";

export const wrongUserResolveScenario: ProtocolScenario = {
  name: "Wrong User Resolve Protection",

  run(): ScenarioResult {
    const steps: StepResult[] = [];

    const wager = {
      id: "test-wrong-resolve",
      state: "ACCEPTED",
      participants: ["userA", "userB"],
      resolution: null as null | { winner: string },
    };

    steps.push({
      step: "wager accepted",
      passed: wager.state === "ACCEPTED",
    });

    const resolvingUser = "userC";

    const allowedResolver = wager.participants.includes(resolvingUser);

    if (allowedResolver) {
      wager.resolution = { winner: resolvingUser };
      wager.state = "RESOLVED";
    }

    steps.push({
      step: "non participant resolve blocked",
      passed: wager.state !== "RESOLVED",
    });

    const passed = steps.every((s) => s.passed);

    return {
      scenario: "Wrong User Resolve Protection",
      passed,
      steps,
    };
  },
};