import type { PreDEXWager, WagerState } from "./predex.types";
import {
  WAGER_STATES,
  isOpenBet,
  isP2PInvite,
} from "./predex.types";
import { isExposureFilled } from "./exposure.logic";

/* =========================================================
   Allowed State Transitions
========================================================= */

const ALLOWED_TRANSITIONS: Record<WagerState, readonly WagerState[]> = {
  [WAGER_STATES.CREATED]: [WAGER_STATES.OPEN, WAGER_STATES.CANCELLED],

  [WAGER_STATES.OPEN]: [WAGER_STATES.LOCKED, WAGER_STATES.CANCELLED],

  [WAGER_STATES.LOCKED]: [WAGER_STATES.RESOLVING],

  [WAGER_STATES.RESOLVING]: [WAGER_STATES.RESOLVED],

  [WAGER_STATES.RESOLVED]: [],

  [WAGER_STATES.CANCELLED]: [],
};

/* =========================================================
   Guards
========================================================= */

function canLock(wager: PreDEXWager): boolean {
  const now = new Date().toISOString();

  // 🔥 Chain P2P → only deadline matters
  if (wager.style === "P2P") {
    return wager.deadline <= now;
  }

  // 🔥 OPEN_BET & P2P_INVITE → deadline OR exposure filled
  if (isOpenBet(wager) || isP2PInvite(wager)) {
    return (
      wager.deadline <= now ||
      isExposureFilled(wager.exposure)
    );
  }

  return false;
}

function canResolve(wager: PreDEXWager): boolean {
  const now = new Date().toISOString();
  return wager.deadline <= now;
}

/* =========================================================
   Transition Validator
========================================================= */

export function canTransitionTo(
  wager: PreDEXWager,
  nextState: WagerState
): boolean {
  const allowed = ALLOWED_TRANSITIONS[wager.state] ?? [];
  if (!allowed.includes(nextState)) return false;

  switch (nextState) {
    case WAGER_STATES.LOCKED:
      return canLock(wager);

    case WAGER_STATES.RESOLVING:
      return canResolve(wager);

    default:
      return true;
  }
}

/* =========================================================
   State Transition
========================================================= */

export function transitionWagerState(
  wager: PreDEXWager,
  nextState: WagerState
): PreDEXWager {
  if (!canTransitionTo(wager, nextState)) {
    throw new Error(
      `Invalid transition: ${wager.state} → ${nextState}`
    );
  }

  return {
    ...wager,
    state: nextState,
  };
}