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

  /* ENGINE TICK */

  useEffect(() => {

    setEngineWagers((prev) =>
      prev.map((w) =>
        w.style === "P2P"
          ? w
          : evaluateWagerLifecycle(w, new Date().toISOString())
      )
    );

  }, [engineWagers.length]);

  /* CHAIN SYNC */

  const runSync = async () => {

    if (!walletAddress) return;

    await syncFromChain({
      walletAddress,
      engineWagersRef,
      setEngineWagers,
      syncingRef
    });

  };

  useEffect(() => {
    runSync();
  }, [walletAddress]);

  return {
    runSync
  };
}