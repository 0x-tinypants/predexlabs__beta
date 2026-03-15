import { useMemo } from "react";

import type { Wager } from "../wager";
import type { PreDEXWager, CounterWager } from "../engine/predex.types";
import type { Market } from "../engine/market.types";
import type { CombinedTile } from "../home/WagerSection";

import { mapPreDEXWagerToUI } from "../mappers/wager.mapper";

type Params = {
  engineWagers: PreDEXWager[];
  counterWagers: CounterWager[];
  engineMarkets: Market[];
  walletAddress: string | null;
};

export function useHomeTiles({
  engineWagers,
  counterWagers,
  engineMarkets,
  walletAddress,
}: Params) {

  /* ------------------------------------------ */
  /* Counter wager lookup                       */
  /* ------------------------------------------ */

  const counterLookup = useMemo(() => {
    const map = new Map<string, CounterWager[]>();

    for (const cw of counterWagers) {
      const arr = map.get(cw.parentWagerId) ?? [];
      arr.push(cw);
      map.set(cw.parentWagerId, arr);
    }

    return map;
  }, [counterWagers]);

  /* ------------------------------------------ */
  /* Engine → UI mapping                        */
  /* ------------------------------------------ */

  const uiWagers: Wager[] = useMemo(() => {

    return engineWagers
      .map((engineWager) => {

        const counters = counterLookup.get(engineWager.id) ?? [];

        return mapPreDEXWagerToUI({
          engineWager,
          counterWagers: counters,
          creatorUsername:
            engineWager.creatorId ??
            (engineWager as any).partyA ??
            "Unknown",
          eventName: "Peer-to-Peer Wager",
          viewerUserId: walletAddress ?? "",
        });

      })
      .filter(Boolean) as Wager[];

  }, [engineWagers, counterLookup, walletAddress]);

  /* ------------------------------------------ */
  /* Filter visible wagers                      */
  /* ------------------------------------------ */

  const activeWagers = useMemo(() => {

    return uiWagers.filter((w) => {

      const chainState = (w as any).chainState;

      /* -------------------------------------- */
      /* Remove resolved wagers                 */
      /* -------------------------------------- */

      if (chainState === 4) return false;

      /* -------------------------------------- */
      /* Handle CREATED wagers                  */
      /* -------------------------------------- */

      if (chainState === 0) {

        const deadline = w.definition?.deadline;

        if (deadline) {

          const deadlineMs = Date.parse(deadline);

          if (!isNaN(deadlineMs) && Date.now() > deadlineMs) {
            /* funding window expired → remove */
            return false;
          }

        }

      }

      /* -------------------------------------- */
      /* FUNDED / PROPOSED / DISPUTED stay      */
      /* -------------------------------------- */

      return true;

    });

  }, [uiWagers]);

  /* ------------------------------------------ */
  /* Combine markets + wagers                   */
  /* ------------------------------------------ */

  const combinedTiles: CombinedTile[] = useMemo(() => {

    const marketTiles: CombinedTile[] = engineMarkets.map((m) => ({
      type: "MARKET",
      data: m,
      createdAt: m.createdAt,
    }));

    const wagerTiles: CombinedTile[] = activeWagers.map((w) => ({
      type: "WAGER",
      data: w,
      createdAt: w.createdAt,
    }));

    return [...marketTiles, ...wagerTiles].sort((a, b) => {

      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return bTime - aTime;

    });

  }, [engineMarkets, activeWagers]);

  /* ------------------------------------------ */
  /* Empty state                                */
  /* ------------------------------------------ */

  const isEmpty =
    engineMarkets.length === 0 &&
    activeWagers.length === 0;

  return {
    uiWagers,
    combinedTiles,
    isEmpty,
  };
}
