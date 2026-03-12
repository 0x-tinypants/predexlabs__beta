import { useState, useRef, useEffect } from "react";
import type { PreDEXWager, CounterWager } from "../engine/predex.types";
import type { Market } from "../engine/market.types";

export function useEngineState() {

  /* ENGINE WAGERS */

  const [engineWagers, setEngineWagers] = useState<PreDEXWager[]>(() => {
    const stored = localStorage.getItem("predex_engine_wagers");
    return stored ? JSON.parse(stored) : [];
  });

  const engineWagersRef = useRef<PreDEXWager[]>(engineWagers);

  useEffect(() => {
    engineWagersRef.current = engineWagers;
  }, [engineWagers]);

  /* COUNTER WAGERS */

  const [counterWagers, setCounterWagers] = useState<CounterWager[]>(() => {
    const stored = localStorage.getItem("predex_counter_wagers");
    return stored ? JSON.parse(stored) : [];
  });

  /* MARKETS */

  const [engineMarkets, setEngineMarkets] = useState<Market[]>(() => {
    const stored = localStorage.getItem("predex_engine_markets");
    return stored ? JSON.parse(stored) : [];
  });

  /* LOCAL PERSISTENCE */

  useEffect(() => {
    localStorage.setItem(
      "predex_engine_wagers",
      JSON.stringify(engineWagers)
    );
  }, [engineWagers]);

  useEffect(() => {
    localStorage.setItem(
      "predex_counter_wagers",
      JSON.stringify(counterWagers)
    );
  }, [counterWagers]);

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