import type { PreDEXWager, CounterWager } from "../engine/predex.types";
import type { Wager } from "../wager/types";

/* =========================================================
   CHAIN STATE → UI STATUS
========================================================= */

function mapChainStateToStatus(state?: number): Wager["status"] {

  switch (state) {

    case 0:
      return "open";

    case 1:
    case 2:
    case 3:
      return "locked";

    case 4:
    case 5:
      return "resolved";

    default:
      return "open";
  }

}

/* =========================================================
   ENGINE RESOLUTION → UI RESOLUTION
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

    default:
      return "NONE";

  }

}

/* =========================================================
   MAIN MAPPER
========================================================= */

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

  const viewer = viewerUserId.toLowerCase();

  /* =========================================================
     P2P WAGER (CHAIN ESCROW)
  ========================================================= */

  if (engineWager.style === "P2P") {

    const partyA = engineWager.partyA?.toLowerCase();
    const partyB = engineWager.partyB?.toLowerCase();

    if (!partyA || !partyB) return null;

    const isParticipant =
      viewer === partyA ||
      viewer === partyB;

    if (!isParticipant) return null;

    const chainState = engineWager.chainState;

    const escrowAddress =
      engineWager.escrowAddress ??
      engineWager.id;

    return {

      id: escrowAddress,

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
        description: engineWager.description ?? "",
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

      /* chain fields */

      style: "P2P",

      escrowAddress,

      chainState,

      partyA,
      partyB,

      disputeDeadline: engineWager.disputeDeadline,

      proposedWinner: engineWager.proposedWinner,

      disputed: engineWager.disputed,
    };

  }

  /* =========================================================
     OPEN BET
  ========================================================= */

  if (engineWager.style !== "OPEN_BET") return null;

  const committed = counterWagers.reduce(
    (sum, cw) => sum + cw.amount,
    0
  );

  const remaining =
    engineWager.exposure.maxExposure -
    engineWager.exposure.reservedExposure;

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
      isParticipant: counterWagers.some(
        (cw) => cw.takerId === viewerUserId
      ),
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

    style: "OPEN_BET",
  };

}