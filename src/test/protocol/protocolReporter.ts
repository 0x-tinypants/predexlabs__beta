import type {
  ProtocolRunResult,
  ScenarioResult,
  StepResult
} from "./protocol.types";

export function reportProtocolResults(result: ProtocolRunResult) {
  console.log("");
  console.log("🧪 PreDEX Protocol Test Results");
  console.log("================================");

  for (const scenario of result.scenarios) {
    printScenario(scenario);
  }

  console.log("");

  if (result.passed) {
    console.log("✅ ALL TESTS PASSED");
  } else {
    console.log("❌ SOME TESTS FAILED");
  }

  console.log("================================");
}

function printScenario(scenario: ScenarioResult) {
  const icon = scenario.passed ? "✅" : "❌";

  console.log("");
  console.log(`${icon} ${scenario.scenario}`);

  for (const step of scenario.steps) {
    printStep(step);
  }
}

function printStep(step: StepResult) {
  const icon = step.passed ? "✓" : "✗";

  if (step.details) {
    console.log(`   ${icon} ${step.step} — ${step.details}`);
  } else {
    console.log(`   ${icon} ${step.step}`);
  }
}