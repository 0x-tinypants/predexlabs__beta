import { useEffect, useRef } from "react";

import { evaluateWagerLifecycle } from "../engine/resolution.engine";
import { syncFromChain } from "../blockchain/chainSync";

import type { PreDEXWager } from "../engine/predex.types";

type Props = {
  walletAddress: string | null;
  engineWagers: PreDEXWager[];
  setEngineWagers: React.Dispatch<React.SetStateAction<PreDEXWager[]>>;
  engineWagersRef: React.MutableRefObject<PreDEXWager[]>;
};

export function useChainSync({
  walletAddress,
  engineWagers,
  setEngineWagers,
  engineWagersRef
}: Props) {

  const syncingRef = useRef(false);

  /* --------------------------------------------------
     ENGINE LIFECYCLE TICK
  -------------------------------------------------- */

  useEffect(() => {

    const interval = setInterval(() => {

      setEngineWagers((prev) =>
        prev.map((w) =>
          w.style === "P2P"
            ? evaluateWagerLifecycle(w, new Date().toISOString())
            : w
        )
      );

    }, 2000); // lifecycle check every 2s

    return () => clearInterval(interval);

  }, []);

  /* --------------------------------------------------
     CHAIN SYNC
  -------------------------------------------------- */

  const runSync = async () => {

    if (!walletAddress) return;

    await syncFromChain({
      walletAddress,
      engineWagersRef,
      setEngineWagers,
      syncingRef
    });

  };

  /* run once on login */

  useEffect(() => {

    if (!walletAddress) return;

    runSync();

  }, [walletAddress]);

  /* background sync */

  useEffect(() => {

    if (!walletAddress) return;

    const interval = setInterval(() => {
      runSync();
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);

  }, [walletAddress]);

  return {
    runSync
  };
}