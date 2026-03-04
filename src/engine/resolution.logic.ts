import type {
  PreDEXWager,
  CounterWager,
  CounterWagerOutcome,
  ISODateString,
} from "./predex.types";
import { WAGER_STATES } from "./predex.types";
import { canTransitionTo, transitionWagerState } from "./wager.state";

/* =========================================================
   Helpers
========================================================= */

function nowISO(): ISODateString {
  return new Date().toISOString();
}

/* =========================================================
   Resolution Model (v0)
   - Participant-verified
   - Conservative: require deadline passed
   - Resolution decided by creator in v0 (temp)
     (We’ll upgrade to dual-confirm + disputes next)
========================================================= */

export type ResolutionDecision = "CREATOR_WIN" | "TAKER_WIN" | "PUSH";

export interface ResolveWagerParams {
  wager: PreDEXWager;

  // all counter-wagers attached to this parent wager
  counterWagers: CounterWager[];

  // who is attempting to resolve
  resolverUserId: string;

  // v0: single decision applies to all slices (same contract terms)
  decision: ResolutionDecision;

  // optional: note / link / proof reference
  proof?: string;
}

export interface ResolveWagerResult {
  updatedWager: PreDEXWager;
  updatedCounterWagers: CounterWager[];
  resolvedAt: ISODateString;
  proof?: string;
}

/* =========================================================
   Guards
========================================================= */

function assertDeadlinePassed(wager: PreDEXWager) {
  const now = nowISO();
  if (wager.deadline > now) {
    throw new Error("Cannot resolve before deadline");
  }
}

function assertResolverAllowed(wager: PreDEXWager, resolverUserId: string) {
  // v0 conservative: only creator can resolve
  // Next iteration: dual-confirmation + disputes.
  if (resolverUserId !== wager.creatorId) {
    throw new Error("Only the creator can resolve this wager (v0)");
  }
}

function normalizeOutcome(decision: ResolutionDecision): CounterWagerOutcome {
  return decision;
}

/* =========================================================
   Main: Resolve Wager
========================================================= */

export function resolveWager(params: ResolveWagerParams): ResolveWagerResult {
  const { wager, counterWagers, resolverUserId, decision, proof } = params;

  // Must be LOCKED or RESOLVING
  if (
    wager.state !== WAGER_STATES.LOCKED &&
    wager.state !== WAGER_STATES.RESOLVING
  ) {
    throw new Error("Wager is not in a resolvable state");
  }

  // Must be past deadline (conservative)
  assertDeadlinePassed(wager);

  // Must have at least one counter-wager to resolve
  if (!counterWagers || counterWagers.length === 0) {
    throw new Error("No counter-wagers to resolve");
  }

  // Resolver permissions
  assertResolverAllowed(wager, resolverUserId);

  // Move wager into RESOLVING if it isn't already (optional but clean)
  let updatedWager = wager;
  if (
    updatedWager.state === WAGER_STATES.LOCKED &&
    canTransitionTo(updatedWager, WAGER_STATES.RESOLVING)
  ) {
    updatedWager = transitionWagerState(updatedWager, WAGER_STATES.RESOLVING);
  }

  const outcome = normalizeOutcome(decision);
  const resolvedAt = nowISO();

  // Apply outcome to all counter-wagers (v0: single decision)
  const updatedCounterWagers: CounterWager[] = counterWagers.map((cw) => {
    if (cw.parentWagerId !== wager.id) {
      throw new Error("Counter-wager does not belong to this parent wager");
    }

    return {
      ...cw,
      resolved: true,
      outcome,
    };
  });

  // Transition wager to RESOLVED
  if (!canTransitionTo(updatedWager, WAGER_STATES.RESOLVED)) {
    throw new Error("Cannot transition wager to RESOLVED");
  }
  updatedWager = transitionWagerState(updatedWager, WAGER_STATES.RESOLVED);

  return {
    updatedWager,
    updatedCounterWagers,
    resolvedAt,
    proof,
  };
}
