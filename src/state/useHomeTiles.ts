import { useMemo } from "react";
import type { Wager } from "../wager";
import type { PreDEXWager, CounterWager } from "../engine/predex.types";
import type { Market } from "../engine/market.types";
import type { CombinedTile } from "../home/WagerSection";
import { mapPreDEXWagerToUI } from "../mappers/wager.mapper";

export function useHomeTiles({
  engineWagers,
  counterWagers,
  engineMarkets,
  walletAddress
}: {
  engineWagers: PreDEXWager[]
  counterWagers: CounterWager[]
  engineMarkets: Market[]
  walletAddress: string | null
}) {

  const counterLookup = useMemo(() => {
    const map = new Map<string, CounterWager[]>();

    for (const cw of counterWagers) {
      if (!map.has(cw.parentWagerId)) {
        map.set(cw.parentWagerId, []);
      }

      map.get(cw.parentWagerId)!.push(cw);
    }

    return map;
  }, [counterWagers]);

  const uiWagers: Wager[] = useMemo(() => {

    return [...engineWagers]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .map((engineWager) => {

        const relatedCounters =
          counterLookup.get(engineWager.id) ?? [];

        return mapPreDEXWagerToUI({
          engineWager,
          counterWagers: relatedCounters,
          creatorUsername: engineWager.creatorId,
          eventName: "turlock city ncga",
          viewerUserId: walletAddress ?? "",
        });
      })

      .filter(
        (w): w is Wager =>
          w !== null &&
          w.resolution.state !== "RESOLVED" &&
          (w as any).chainState !== 4
      );

  }, [engineWagers, counterWagers, walletAddress]);

  const activeWagers = useMemo(
    () =>
      uiWagers.filter((w) => {
        if (w.resolution.state === "RESOLVED") return false;
        if (w.resolution.state === "CLAIMABLE") return false;
        if (w.resolution.state === "PROPOSED") return false;
        if (w.resolution.state === "DISPUTED") return false;
        if ((w as any).chainState === 4) return false;
        return true;
      }),
    [uiWagers]
  );

  const combinedTiles: CombinedTile[] = useMemo(() => {

    return [
      ...engineMarkets.map((m) => ({
        type: "MARKET" as const,
        data: m,
        createdAt: m.createdAt,
      })),
      ...activeWagers.map((w) => ({
        type: "WAGER" as const,
        data: w,
        createdAt: w.createdAt,
      })),
    ].sort((a, b) => {

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return bTime - aTime;

    });

  }, [engineMarkets, activeWagers]);

  const isEmpty =
    engineMarkets.length === 0 &&
    activeWagers.length === 0;

  return {
    uiWagers,
    combinedTiles,
    isEmpty
  };
}