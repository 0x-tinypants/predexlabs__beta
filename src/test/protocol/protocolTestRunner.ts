import type {
  ProtocolScenario,
  ProtocolRunResult,
  ScenarioResult,
} from "./protocol.types";
import { reportProtocolResults } from "./protocolReporter";
import { openBetScenario } from "./scenarios/openBet.scenario";
import { p2pScenario } from "./scenarios/p2p.scenario";
import { doubleClaimScenario } from "./scenarios/doubleClaim.scenario";
import { resolveBeforeAcceptScenario } from "./scenarios/resolveBeforeAccept.scenario";
import { wrongUserResolveScenario } from "./scenarios/wrongUserResolve.scenario";

const scenarios: ProtocolScenario[] = [
  openBetScenario,
  p2pScenario,
  doubleClaimScenario,
  resolveBeforeAcceptScenario,
  wrongUserResolveScenario,
];

export function runProtocolTests(): ProtocolRunResult {
  const results: ScenarioResult[] = [];

  for (const scenario of scenarios) {
    try {
      const result = scenario.run();
      results.push(result);
    } catch (err) {
      results.push({
        scenario: scenario.name,
        passed: false,
        steps: [
          {
            step: "scenario execution",
            passed: false,
            details: err instanceof Error ? err.message : "unknown error",
          },
        ],
      });
    }
  }

  const passed = results.every((s) => s.passed);

  const runResult: ProtocolRunResult = {
    passed,
    scenarios: results,
  };

  reportProtocolResults(runResult);

  return runResult;
}