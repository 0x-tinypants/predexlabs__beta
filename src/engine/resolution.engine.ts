import type {
  PreDEXWager,
  ResolutionOutcome,
  Claim,
} from "./predex.types";

// DEV tuning (later: 4–6 hours)
const DISPUTE_WINDOW_MS = 30 * 1000; // 30 seconds for testing

/* =========================================================
   SUBMIT CLAIM (PROPOSE WINNER)
========================================================= */

export function submitClaim(
  wagers: PreDEXWager[],
  input: {
    wagerId: string;
    claimantId: string;
    outcome: ResolutionOutcome;
    timestamp: string;
  }
): PreDEXWager[] {
  const wager = wagers.find((w) => w.id === input.wagerId);
  if (!wager) throw new Error("Wager not found");

  // Must be claimable
  if (wager.resolution.state !== "CLAIMABLE") {
    throw new Error("Wager is not claimable");
  }

  const newClaim: Claim = {
    claimantId: input.claimantId,
    outcome: input.outcome,
    claimedAt: input.timestamp,
  };

  const disputeDeadlineISO = new Date(
    new Date(input.timestamp).getTime() + DISPUTE_WINDOW_MS
  ).toISOString();

  const updatedWager: PreDEXWager = {
    ...wager,
    resolution: {
      ...wager.resolution,
      claims: [newClaim],
      state: "PROPOSED",
      proposedOutcome: input.outcome,
      proposedBy: input.claimantId,
      disputeDeadline: disputeDeadlineISO,
    },
  };

  return wagers.map((w) =>
    w.id === wager.id ? updatedWager : w
  );
}

/* =========================================================
   LIFECYCLE EVALUATION
========================================================= */

export function evaluateWagerLifecycle(
  wager: PreDEXWager,
  nowISO: string
): PreDEXWager {

  if (!wager.resolution) {
    return {
      ...wager,
      resolution: {
        state: "PENDING",
        claims: [],
      },
    };
  }

  const now = new Date(nowISO);


  /* -----------------------------
     OPEN → LOCKED → CLAIMABLE
  ----------------------------- */
  if (wager.state === "RESOLVED" || wager.state === "CANCELLED") {
    return wager;
  }

  if (
    wager.state === "LOCKED" &&
    wager.resolution.state === "PENDING" &&
    now >= new Date(wager.deadline)
  ) {
    return {
      ...wager,
      resolution: {
        ...wager.resolution,
        state: "CLAIMABLE",
      },
    };
  }


  /* -----------------------------
     PROPOSED → RESOLVED
     (after dispute window)
  ----------------------------- */

  if (
    wager.resolution.state === "PROPOSED" &&
    wager.resolution.disputeDeadline &&
    now >= new Date(wager.resolution.disputeDeadline)
  ) {
    return {
      ...wager,
      state: "RESOLVED", // ✅ ENGINE TERMINAL
      resolution: {
        ...wager.resolution,
        state: "RESOLVED", // ✅ CLAIM FINALIZED
        outcome: wager.resolution.proposedOutcome,
        resolvedAt: nowISO,
      },
    };

  }


  return wager;
}
