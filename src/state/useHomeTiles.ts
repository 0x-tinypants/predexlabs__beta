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
  /* Counter wager lookup table                 */
  /* ------------------------------------------ */

  const counterLookup = useMemo(() => {
    const map = new Map<string, CounterWager[]>();

    for (const cw of counterWagers) {
      const existing = map.get(cw.parentWagerId) ?? [];
      existing.push(cw);
      map.set(cw.parentWagerId, existing);
    }

    return map;
  }, [counterWagers]);

  /* ------------------------------------------ */
  /* Convert engine wagers → UI wagers          */
  /* ------------------------------------------ */

  const uiWagers: Wager[] = useMemo(() => {

    console.log("HOME engineWagers", engineWagers);


    return [...engineWagers]

      /* newest first */
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })

      .map((engineWager) => {

        const relatedCounters =
          counterLookup.get(engineWager.id) ?? [];

        const mapped = mapPreDEXWagerToUI({
          engineWager,
          counterWagers: relatedCounters,
          creatorUsername:
            engineWager.creatorId ??
            (engineWager as any).partyA ??
            "Unknown",
          eventName: "Peer-to-Peer Wager",
          viewerUserId: walletAddress ?? "",
        });

        /* -------------------------------------- */
        /* Fallback if mapper fails               */
        /* -------------------------------------- */
        if (!mapped) {
          const e: any = engineWager;

          const creator =
            e.partyA ??
            e.creatorId ??
            "";

          const opponent =
            e.partyB ??
            "";

          const fallback = {
            id: e.id,
            style: "P2P",

            createdAt:
              e.createdAt ??
              new Date().toISOString(),

            partyA: creator,
            partyB: opponent,

            escrowAddress: e.escrowAddress ?? "",

            stake: e.stake ?? 0,

            definition: {
              description: "Peer-to-Peer Wager",
              deadline: e.deadline
                ? new Date(
                  typeof e.deadline === "number"
                    ? e.deadline * 1000
                    : e.deadline
                ).toISOString()
                : null
            },

            exposure: {
              maxLoss: e.stake ?? 0
            },

            resolution: {
              state: "OPEN"
            }
          };

          return fallback as unknown as Wager;
        }

        return mapped;

      })

      /* -------------------------------------- */
      /* Remove closed wagers                   */
      /* -------------------------------------- */

      .filter((w): w is Wager => {

        if (!w) return false;

        if (w.resolution?.state === "RESOLVED")
          return false;

        if ((w as any).chainState === 4)
          return false;

        return true;

      });

  }, [engineWagers, counterWagers, walletAddress, counterLookup]);

  /* ------------------------------------------ */
  /* Active wagers only                         */
  /* ------------------------------------------ */

  const activeWagers = useMemo(() => {

    return uiWagers.filter((w) => {

      const state = w.resolution?.state;

      if (state === "RESOLVED") return false;
      if (state === "CLAIMABLE") return false;
      if (state === "PROPOSED") return false;
      if (state === "DISPUTED") return false;

      if ((w as any).chainState === 4)
        return false;

      /* NEW — remove expired wagers */
      const deadline = w.definition?.deadline;

      if (deadline) {
        const deadlineMs = Date.parse(deadline);
        if (!isNaN(deadlineMs) && Date.now() > deadlineMs) return false;
        if (Date.now() > deadlineMs) return false;
      }

      return true;

    });

  }, [uiWagers]);

  /* ------------------------------------------ */
  /* Combine markets + wagers                   */
  /* ------------------------------------------ */

  const combinedTiles: CombinedTile[] = useMemo(() => {

    const marketTiles: CombinedTile[] =
      engineMarkets.map((m) => ({
        type: "MARKET",
        data: m,
        createdAt: m.createdAt,
      }));

    const wagerTiles: CombinedTile[] =
      activeWagers.map((w) => ({
        type: "WAGER",
        data: w,
        createdAt: w.createdAt,
      }));

    const result = [...marketTiles, ...wagerTiles].sort(
      (a, b) => {

        const aTime = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const bTime = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return bTime - aTime;

      }
    );

    console.log("HOME activeWagers", activeWagers);
    console.log("HOME combinedTiles", result);
    console.log("HOME uiWagers result", engineWagers.length);


    return result;

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