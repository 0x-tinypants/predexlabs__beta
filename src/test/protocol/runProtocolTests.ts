import { runProtocolTests as runProtocolTestRunner } from "./protocolTestRunner";

/*
Expose runner globally in development
and export it so UI buttons can call it
*/

declare global {
  interface Window {
    runProtocolTests: () => void;
  }
}

/* export for UI */
export function runProtocolTests() {
  return runProtocolTestRunner();
}

/* optional global install for console use */
export function installProtocolTestRunner() {
  if (typeof window === "undefined") return;

  window.runProtocolTests = () => {
    runProtocolTestRunner();
  };

  console.log("🧪 PreDEX Protocol Test Runner Installed");
  console.log("Run tests with: runProtocolTests()");
}