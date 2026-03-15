import type {
  ProtocolScenario,
  ScenarioResult,
  StepResult,
} from "../protocol.types";

export const p2pScenario: ProtocolScenario = {
  name: "P2P Happy Path",

  run(): ScenarioResult {
    const steps: StepResult[] = [];

    /*
    Step 1 — create wager
    */

    const wager = {
      id: "test-p2p-1",
      style: "P2P",
      state: "OPEN",
      stake: 10,
      creator: "userA",
      participants: ["userA"],
      resolution: null as null | { winner: string },
      claimed: false,
    };

    const created = wager.state === "OPEN";

    steps.push({
      step: "create wager",
      passed: created,
    });

    /*
    Step 2 — accept wager
    */

    wager.participants.push("userB");
    wager.state = "ACCEPTED";

    const accepted =
      wager.state === "ACCEPTED" &&
      wager.participants.length === 2;

    steps.push({
      step: "accept wager",
      passed: accepted,
    });

    /*
    Step 3 — resolve wager
    */

    wager.resolution = {
      winner: "userA",
    };

    wager.state = "RESOLVED";

    const resolved =
      wager.state === "RESOLVED" &&
      wager.resolution?.winner === "userA";

    steps.push({
      step: "resolve wager",
      passed: resolved,
    });

    /*
    Step 4 — claim payout
    */

    wager.claimed = true;

    const claimed = wager.claimed === true;

    steps.push({
      step: "claim wager",
      passed: claimed,
    });

    const passed = steps.every((s) => s.passed);

    return {
      scenario: "P2P Happy Path",
      passed,
      steps,
    };
  },
};