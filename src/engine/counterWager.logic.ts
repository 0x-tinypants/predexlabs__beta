import type {
  PreDEXWager,
  CounterWager,
  ISODateString,
} from "./predex.types";
import { WAGER_STATES } from "./predex.types";
import {
  canReserveExposure,
  reserveExposure,
} from "./exposure.logic";
import { canTransitionTo, transitionWagerState } from "./wager.state";

/* =========================================================
   Helpers
========================================================= */

function nowISO(): ISODateString {
  return new Date().toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/* =========================================================
   Create Counter-Wager (PURE)
========================================================= */

/**
 * Attempts to attach a counter-wager to a parent PreDEX wager.
 * Returns updated wager + new counter-wager.
 */
export function createCounterWager(params: {
  wager: PreDEXWager;
  takerId: string;
  amount: number;
}): {
  updatedWager: PreDEXWager;
  counterWager: CounterWager;
} {
  const { wager, takerId, amount } = params;

  // 1) Must be OPEN
  if (wager.state !== WAGER_STATES.OPEN) {
    throw new Error("Wager is not open for counter-wagers");
  }

  // 2) Deadline must not be passed
  if (wager.deadline <= nowISO()) {
    throw new Error("Wager deadline has passed");
  }

  // 3) Exposure must be reservable
  if (!canReserveExposure(wager.exposure, amount)) {
    throw new Error("Exposure cannot be reserved for this amount");
  }

  // 4) Reserve exposure (pure)
  const updatedExposure = reserveExposure(wager.exposure, amount);

  // 5) Create bilateral counter-wager slice
  const counterWager: CounterWager = {
    id: generateId("cw"),
    parentWagerId: wager.id,
    takerId,
    amount,
    lockedAt: nowISO(),
    resolved: false,
  };

  let updatedWager: PreDEXWager = {
    ...wager,
    exposure: updatedExposure,
  };

  // 6) Auto-lock if exposure filled
  if (
    updatedExposure.reservedExposure >=
      updatedExposure.maxExposure &&
    canTransitionTo(updatedWager, WAGER_STATES.LOCKED)
  ) {
    updatedWager = transitionWagerState(
      updatedWager,
      WAGER_STATES.LOCKED
    );
  }

  return { updatedWager, counterWager };
}
