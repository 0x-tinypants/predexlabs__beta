export type StepResult = {
  step: string;
  passed: boolean;
  details?: string;
};

export type ScenarioResult = {
  scenario: string;
  passed: boolean;
  steps: StepResult[];
};

export type ProtocolRunResult = {
  passed: boolean;
  scenarios: ScenarioResult[];
};

export type ProtocolScenario = {
  name: string;
  run: () => ScenarioResult;
};