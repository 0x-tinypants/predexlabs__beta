// src/engine/p2p.engine.ts

import type {
  EngineP2PInviteWager,
  ISODateString,
} from "./predex.types";

import { WAGER_STATES } from "./predex.types";

/* =========================================================
   Helpers
========================================================= */

function nowISO(): ISODateString {
  return new Date().toISOString();
}

function validateSides(sideA: string[], sideB: string[]) {
  if (sideA.length !== sideB.length) {
    throw new Error("Sides must be equal length");
  }

  if (sideA.length !== 1 && sideA.length !== 2) {
    throw new Error("Only 1v1 and 2v2 supported");
  }

  const all = [...sideA, ...sideB];
  const unique = new Set(all);

  if (unique.size !== all.length) {
    throw new Error("Duplicate participants detected");
  }
}

/* =========================================================
   CREATE P2P INVITE WAGER (OFF-CHAIN)
========================================================= */

export function createP2PWager(params: {
  id: string;
  creatorId: string;
  description: string;
  line?: string;
  deadline: ISODateString;
  sideA: string[];
  sideB: string[];
  stakePerParticipant: number;
}): EngineP2PInviteWager {
  const {
    id,
    creatorId,
    description,
    line,
    deadline,
    sideA,
    sideB,
    stakePerParticipant,
  } = params;

  validateSides(sideA, sideB);

  if (![...sideA, ...sideB].includes(creatorId)) {
    throw new Error("Creator must be included in sides");
  }

  if (stakePerParticipant <= 0) {
    throw new Error("Invalid stake amount");
  }

  return {
    id,

    style: "P2P_INVITE",

    creatorId,

    assertionType: "head_to_head",
    declaredDirection: "sideA",

    description,
    line,
    deadline,

    state: WAGER_STATES.CREATED,

    exposure: {
      maxExposure:
        stakePerParticipant *
        (sideA.length + sideB.length),
      reservedExposure: 0,
    },

    createdAt: nowISO(),

    resolution: {
      state: "PENDING",
      claims: [],
    },

    p2p: {
      sideA,
      sideB,
      accepted: [creatorId],
      stakePerParticipant,
    },
  };
}

/* =========================================================
   ACCEPT P2P INVITE
========================================================= */

export function acceptP2PWager(
  wager: EngineP2PInviteWager,
  userId: string
): EngineP2PInviteWager {
  if (wager.style !== "P2P_INVITE") {
    throw new Error("Not a P2P invite wager");
  }

  if (wager.state !== WAGER_STATES.CREATED) {
    throw new Error("Wager is not accepting invites");
  }

  const invited = [
    ...wager.p2p.sideA,
    ...wager.p2p.sideB,
  ];

  if (!invited.includes(userId)) {
    throw new Error("User not invited");
  }

  if (wager.p2p.accepted.includes(userId)) {
    throw new Error("User already accepted");
  }

  const updatedAccepted = [
    ...wager.p2p.accepted,
    userId,
  ];

  const totalParticipants = invited.length;

  const allAccepted =
    updatedAccepted.length === totalParticipants;

  return {
    ...wager,
    state: allAccepted
      ? WAGER_STATES.LOCKED
      : wager.state,
    p2p: {
      ...wager.p2p,
      accepted: updatedAccepted,
    },
  };
}

/* =========================================================
   DECLINE P2P INVITE
========================================================= */

export function declineP2PWager(
  wager: EngineP2PInviteWager,
  userId: string
): EngineP2PInviteWager {
  if (wager.style !== "P2P_INVITE") {
    throw new Error("Not a P2P invite wager");
  }

  if (wager.state !== WAGER_STATES.CREATED) {
    throw new Error("Cannot decline at this stage");
  }

  const invited = [
    ...wager.p2p.sideA,
    ...wager.p2p.sideB,
  ];

  if (!invited.includes(userId)) {
    throw new Error("User not invited");
  }

  return {
    ...wager,
    state: WAGER_STATES.CANCELLED,
  };
}