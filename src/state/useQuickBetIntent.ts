import { useState } from "react";

/* =========================
   QUICK BET INTENT
   (No side selection)
========================= */

export type QuickBetIntent = {
  wagerId: string;
  direction: "more" | "less" | "sideA" | "sideB";
};


export function useQuickBetIntent() {
  const [intent, setIntent] = useState<QuickBetIntent | null>(null);

  function openQuickBet(intent: QuickBetIntent) {
    setIntent(intent);
  }

  function clearQuickBet() {
    setIntent(null);
  }

  return { intent, openQuickBet, clearQuickBet };
}


