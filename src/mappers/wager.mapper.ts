import type { PreDEXWager, CounterWager } from "../engine/predex.types";
import type { Wager } from "../wager/types";

/* =========================================================
   Engine → UI Mapper
   - OPEN_BET: engine truth (existing)
   - P2P: chain-backed fields carried through (escrow/state/parties)
========================================================= */

function mapEngineResolutionState(
  state?: "PENDING" | "CLAIMABLE" | "PROPOSED" | "RESOLVED" | "DISPUTED"
): Wager["resolution"]["state"] {
  switch (state) {
    case "CLAIMABLE":
    case "PROPOSED":
    case "DISPUTED":
    case "RESOLVED":
      return state;
    case "PENDING":
    default:
      return "NONE";
  }
}

/**
 * IMPORTANT:
 * Your UI Wager type only supports:
 *   status: "open" | "locked" | "resolved"
 * So we compress chain states into those 3.
 */
function mapChainStateToStatus(state?: number): Wager["status"] {
  switch (state) {
    case 0: // CREATED
      return "open";
    case 1: // FUNDED
    case 2: // PROPOSED
    case 3: // DISPUTED
      return "locked";
    case 4: // RESOLVED
    case 5: // REFUNDED (treat as resolved for UI union)
      return "resolved";
    default:
      return "open";
  }
}

export function mapPreDEXWagerToUI(params: {
  engineWager: PreDEXWager;
  counterWagers: CounterWager[];
  creatorUsername: string;
  eventName: string;
  viewerUserId: string;
}): Wager | null {
  const {
    engineWager,
    counterWagers,
    creatorUsername,
    eventName,
    viewerUserId,
  } = params;

  /* =========================================================
     P2P (CHAIN-BACKED)
     - visible only to partyA / partyB
     - uses chain fields carried on engineWager (populated by syncFromChain)
  ========================================================= */

  if (engineWager.style === "P2P") {
    const partyA = engineWager.partyA as string | undefined;
    const partyB = engineWager.partyB as string | undefined;

    if (!partyA || !partyB) return null;

    const isParticipant =
      viewerUserId.toLowerCase() === partyA.toLowerCase() ||
      viewerUserId.toLowerCase() === partyB.toLowerCase();

    if (!isParticipant) return null;

const chainState = engineWager.chainState;

    return {
      id: engineWager.id,

      creatorId: engineWager.creatorId,
      creatorUsername,

      type: "head_to_head",

      exposure: {
        maxLoss: engineWager.stakePerParticipant ?? 0,
      },

      context: {
        category: "Sports",
        descriptor: "Golf",
      },

      definition: {
        description: "Peer-to-Peer Wager",
        line: undefined,
        deadline: engineWager.deadline,
        declaredDirection: "sideA",
      },

      participants: {
        mode: "p2p",
      },

      viewer: {
        isCreator: engineWager.creatorId === viewerUserId,
        isParticipant: true,
      },

      totals: {
        committed: 0,
        remaining: 0,
      },

      status: mapChainStateToStatus(chainState),

      resolution: {
        state: "NONE",
        resolvedAt: undefined,
      },

      createdAt: engineWager.createdAt,
      eventName,

      // chain extensions
      style: "P2P",
      escrowAddress: engineWager.escrowAddress,
      chainState,
      partyA,
      partyB,

      disputeDeadline: engineWager.disputeDeadline,
      proposedWinner: engineWager.proposedWinner,
      disputed: engineWager.disputed,
    };
  }

  /* =========================================================
     OPEN BET (ENGINE TRUTH) — preserved
  ========================================================= */

  if (engineWager.style !== "OPEN_BET") {
    return null;
  }

  const committed = counterWagers.reduce((sum, cw) => sum + cw.amount, 0);

  const remaining =
    engineWager.exposure.maxExposure - engineWager.exposure.reservedExposure;

  const resolution: Wager["resolution"] = {
    state: mapEngineResolutionState(engineWager.resolution?.state),
    resolvedAt: engineWager.resolution?.resolvedAt,
  };

  return {
    id: engineWager.id,

    creatorId: engineWager.creatorId,
    creatorUsername,

    type:
      engineWager.assertionType === "head_to_head"
        ? "head_to_head"
        : "over_under",

    exposure: {
      maxLoss: engineWager.exposure.maxExposure,
      minPerParticipant: engineWager.exposure.minPerCounterparty,
      maxPerParticipant: engineWager.exposure.maxPerCounterparty,
    },

    context: {
      category: "Sports",
      descriptor: "Golf",
    },

    definition: {
      description: engineWager.description,
      line: engineWager.line,
      deadline: engineWager.deadline,
      declaredDirection: engineWager.declaredDirection,
    },

    participants: {
      mode: "open",
    },

    viewer: {
      isCreator: engineWager.creatorId === viewerUserId,
      isParticipant: counterWagers.some((cw) => cw.takerId === viewerUserId),
    },

    totals: {
      committed,
      remaining,
    },

    status:
      engineWager.state === "RESOLVED"
        ? "resolved"
        : engineWager.state === "LOCKED"
          ? "locked"
          : "open",

    createdAt: engineWager.createdAt,

    eventName,

    resolution,

    // optional style marker (nice to have)
    style: "OPEN_BET",
  };
}