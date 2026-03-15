import type {
  PreDEXWager,
  ResolutionOutcome,
  Claim,
} from "./predex.types";

import { logger } from "../dev/logger";
/* =========================================================
   CONFIG
========================================================= */

const DISPUTE_WINDOW_MS = 30 * 1000; // 30s for testing



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

  if (!wager) {
    logger.error("submitClaim: wager not found", { wagerId: input.wagerId });
    throw new Error("Wager not found");
  }

  if (wager.resolution.state !== "CLAIMABLE") {
    logger.warn("submitClaim: wager not claimable", {
      wagerId: wager.id,
      resolutionState: wager.resolution.state,
    });
    throw new Error("Wager is not claimable");
  }

  const claim: Claim = {
    claimantId: input.claimantId,
    outcome: input.outcome,
    claimedAt: input.timestamp,
  };

  const disputeDeadline = new Date(
    new Date(input.timestamp).getTime() + DISPUTE_WINDOW_MS
  ).toISOString();

  const updated: PreDEXWager = {
    ...wager,
    resolution: {
      ...wager.resolution,
      claims: [claim],
      state: "PROPOSED",
      proposedOutcome: input.outcome,
      proposedBy: input.claimantId,
      disputeDeadline,
    },
  };

  logger.sync("submitClaim: proposed winner", {
    wagerId: updated.id,
    outcome: updated.resolution.proposedOutcome,
    disputeDeadline,
  });

  return wagers.map((w) => (w.id === wager.id ? updated : w));
}



/* =========================================================
   LIFECYCLE EVALUATION
========================================================= */

export function evaluateWagerLifecycle(
  wager: PreDEXWager,
  nowISO: string
): PreDEXWager {

  const now = new Date(nowISO);

  /* -------------------------------------------------------
     Ensure resolution object exists
  ------------------------------------------------------- */

  if (!wager.resolution) {
    return {
      ...wager,
      resolution: {
        state: "PENDING",
        claims: [],
      },
    };
  }

  /* -------------------------------------------------------
     Skip terminal wagers
  ------------------------------------------------------- */

  if (wager.state === "RESOLVED" || wager.state === "CANCELLED") {
    return wager;
  }

  /* -------------------------------------------------------
     LOCKED → CLAIMABLE
  ------------------------------------------------------- */

  if (
    wager.state === "LOCKED" &&
    wager.resolution.state === "PENDING" &&
    now >= new Date(wager.deadline)
  ) {

    logger.sync("lifecycle: wager claimable", {
      wagerId: wager.id,
    });

    return {
      ...wager,
      resolution: {
        ...wager.resolution,
        state: "CLAIMABLE",
      },
    };
  }

  /* -------------------------------------------------------
     PROPOSED → RESOLVED
  ------------------------------------------------------- */

  if (
    wager.resolution.state === "PROPOSED" &&
    wager.resolution.disputeDeadline &&
    now >= new Date(wager.resolution.disputeDeadline)
  ) {

    logger.sync("lifecycle: wager resolved", {
      wagerId: wager.id,
      outcome: wager.resolution.proposedOutcome,
    });

    return {
      ...wager,
      state: "RESOLVED",
      resolution: {
        ...wager.resolution,
        state: "RESOLVED",
        outcome: wager.resolution.proposedOutcome,
        resolvedAt: nowISO,
      },
    };
  }

  return wager;
}