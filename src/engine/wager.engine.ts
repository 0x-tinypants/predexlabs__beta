import type {
  PreDEXWager,
  OpenEngineWager,
  ChainP2PWager,
} from "./predex.types";

import { logLifecycle } from "../dev/lifecycleLogger";

export function createWager(
  wagers: PreDEXWager[],
  newWager: Omit<OpenEngineWager, "resolution"> | Omit<ChainP2PWager, "resolution">
): PreDEXWager[] {
  if (newWager.style === "OPEN_BET") {
    const initializedWager: OpenEngineWager = {
      ...newWager,
      resolution: {
        state: "PENDING",
        claims: [],
      },
    };

    logLifecycle("ENGINE_WAGER_BUILT", initializedWager.id);

    return [initializedWager, ...wagers];
  }

  if (newWager.style === "P2P") {
    const initializedWager: ChainP2PWager = {
      ...newWager,
      resolution: {
        state: "PENDING",
        claims: [],
      },
    };

    logLifecycle("ENGINE_WAGER_BUILT", initializedWager.id);

    return [initializedWager, ...wagers];
  }

  return wagers;
}