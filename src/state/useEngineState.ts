import { useState, useRef, useEffect } from "react";
import type { PreDEXWager, CounterWager } from "../engine/predex.types";
import type { Market } from "../engine/market.types";

function normalize(addr?: string) {
  return (addr ?? "").toLowerCase();
}

function dedupeWagers(wagers: PreDEXWager[]) {

  const map = new Map<string, PreDEXWager>();

  for (const w of wagers) {

    const key =
      w.style === "P2P"
        ? normalize(w.escrowAddress)
        : w.id;

    if (!key) continue;

    map.set(key, {
      ...map.get(key),
      ...w
    });

  }

  return Array.from(map.values());

}

export function useEngineState() {

  /* ENGINE WAGERS */

  const [engineWagers, setEngineWagers] = useState<PreDEXWager[]>(() => {

    try {

      const stored = localStorage.getItem("predex_engine_wagers");

      if (!stored) return [];

      const parsed = JSON.parse(stored);

      return dedupeWagers(parsed);

    } catch {
      return [];
    }

  });

  const engineWagersRef = useRef<PreDEXWager[]>(engineWagers);

  useEffect(() => {
    engineWagersRef.current = engineWagers;
  }, [engineWagers]);

  /* COUNTER WAGERS */

  const [counterWagers, setCounterWagers] = useState<CounterWager[]>(() => {

    try {

      const stored = localStorage.getItem("predex_counter_wagers");

      return stored ? JSON.parse(stored) : [];

    } catch {
      return [];
    }

  });

  /* MARKETS */

  const [engineMarkets, setEngineMarkets] = useState<Market[]>(() => {

    try {

      const stored = localStorage.getItem("predex_engine_markets");

      return stored ? JSON.parse(stored) : [];

    } catch {
      return [];
    }

  });

  /* CACHE ENGINE WAGERS */

  useEffect(() => {

    localStorage.setItem(
      "predex_engine_wagers",
      JSON.stringify(engineWagers)
    );

  }, [engineWagers]);

  /* CACHE COUNTER WAGERS */

  useEffect(() => {

    localStorage.setItem(
      "predex_counter_wagers",
      JSON.stringify(counterWagers)
    );

  }, [counterWagers]);

  /* CACHE MARKETS */

  useEffect(() => {

    localStorage.setItem(
      "predex_engine_markets",
      JSON.stringify(engineMarkets)
    );

  }, [engineMarkets]);

  return {

    engineWagers,
    setEngineWagers,
    engineWagersRef,

    counterWagers,
    setCounterWagers,

    engineMarkets,
    setEngineMarkets

  };

}