import type {
  PreDEXWager,
  CounterWager,
  ISODateString,
  OpenEngineWager,
} from "./predex.types";

import {
  WAGER_STATES,
  isOpenBet,
} from "./predex.types";

import {
  canReserveExposure,
  reserveExposure,
} from "./exposure.logic";

import {
  canTransitionTo,
  transitionWagerState,
} from "./wager.state";

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
   Only valid for OPEN_BET style
========================================================= */

export function createCounterWager(params: {
  wager: PreDEXWager;
  takerId: string;
  amount: number;
}): {
  updatedWager: PreDEXWager;
  counterWager: CounterWager;
} {
  const { wager, takerId, amount } = params;

  /* -------------------------------------------------------
     0) Must be OPEN_BET (exposure-based wagers only)
  ------------------------------------------------------- */

  if (!isOpenBet(wager)) {
    throw new Error(
      "Counter wagers only allowed on OPEN_BET wagers"
    );
  }

  const openWager: OpenEngineWager = wager;

  /* -------------------------------------------------------
     1) Must be OPEN
  ------------------------------------------------------- */

  if (openWager.state !== WAGER_STATES.OPEN) {
    throw new Error("Wager is not open for counter-wagers");
  }

  /* -------------------------------------------------------
     2) Deadline must not be passed
  ------------------------------------------------------- */

  if (openWager.deadline <= nowISO()) {
    throw new Error("Wager deadline has passed");
  }

  /* -------------------------------------------------------
     3) Exposure must be reservable
  ------------------------------------------------------- */

  if (!canReserveExposure(openWager.exposure, amount)) {
    throw new Error(
      "Exposure cannot be reserved for this amount"
    );
  }

  /* -------------------------------------------------------
     4) Reserve exposure (pure)
  ------------------------------------------------------- */

  const updatedExposure = reserveExposure(
    openWager.exposure,
    amount
  );

  /* -------------------------------------------------------
     5) Create counter-wager slice
  ------------------------------------------------------- */

  const counterWager: CounterWager = {
    id: generateId("cw"),
    parentWagerId: openWager.id,
    takerId,
    amount,
    lockedAt: nowISO(),
    resolved: false,
  };

  /* -------------------------------------------------------
     6) Update wager
  ------------------------------------------------------- */

  let updatedWager: OpenEngineWager = {
    ...openWager,
    exposure: updatedExposure,
  };

  /* -------------------------------------------------------
     7) Auto-lock if exposure filled
  ------------------------------------------------------- */

  if (
    updatedExposure.reservedExposure >=
      updatedExposure.maxExposure &&
    canTransitionTo(updatedWager, WAGER_STATES.LOCKED)
  ) {
    updatedWager = transitionWagerState(
      updatedWager,
      WAGER_STATES.LOCKED
    ) as OpenEngineWager;
  }

  return {
    updatedWager,
    counterWager,
  };
}