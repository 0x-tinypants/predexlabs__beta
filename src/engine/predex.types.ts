/* =========================================================
   PreDEX — Core Engine Types (v1)
   Authoritative, non-UI, non-custodial
========================================================= */

/* =========================
   ENUMS & PRIMITIVES
========================= */

export const WAGER_STATES = {
  CREATED: "CREATED",
  OPEN: "OPEN",
  LOCKED: "LOCKED",
  RESOLVING: "RESOLVING",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
} as const;

export type WagerState =
  typeof WAGER_STATES[keyof typeof WAGER_STATES];

export const DECLARED_DIRECTIONS = {
  MORE: "more",
  LESS: "less",
  SIDE_A: "sideA",
  SIDE_B: "sideB",
} as const;

export type DeclaredDirection =
  typeof DECLARED_DIRECTIONS[keyof typeof DECLARED_DIRECTIONS];

export const ASSERTION_TYPES = {
  SELF_PERFORMANCE: "self_performance",
  HEAD_TO_HEAD: "head_to_head",
} as const;

export type AssertionType =
  typeof ASSERTION_TYPES[keyof typeof ASSERTION_TYPES];

export type ISODateString = string;

export const WAGER_STYLES = {
  OPEN_BET: "OPEN_BET",
  P2P_INVITE: "P2P_INVITE",
  P2P: "P2P",
  MARKET: "MARKET",
} as const;

export type WagerStyle =
  typeof WAGER_STYLES[keyof typeof WAGER_STYLES];

/* =========================
   RESOLUTION (ENGINE ONLY)
========================= */

export type ResolutionOutcome =
  | "CREATOR_WIN"
  | "COUNTERPARTY_WIN";

export interface Claim {
  claimantId: string;
  outcome: ResolutionOutcome;
  claimedAt: ISODateString;
}

export type Resolution = {
  state:
  | "PENDING"
  | "CLAIMABLE"
  | "PROPOSED"
  | "RESOLVED"
  | "DISPUTED";

  claims: Claim[];

  proposedOutcome?: ResolutionOutcome;
  proposedBy?: string;
  disputeDeadline?: string;

  outcome?: ResolutionOutcome;
  resolvedAt?: string;
};

/* =========================
   EXPOSURE BUCKET
========================= */

export interface ExposureBucket {
  maxExposure: number;
  reservedExposure: number;
  minPerCounterparty?: number;
  maxPerCounterparty?: number;
}

/* =========================================================
   OPEN ENGINE WAGER (OFF-CHAIN LOGIC)
========================================================= */

export interface OpenEngineWager {
  id: string;

  style: "OPEN_BET"; // 🔥 strict literal

  creatorId: string;

  assertionType: AssertionType;
  declaredDirection: DeclaredDirection;

  description: string;
  line?: string;

  deadline: ISODateString;

  state: WagerState;

  exposure: ExposureBucket;

  resolution: Resolution;

  createdAt: ISODateString;

  p2p?: {
    sideA: string[];
    sideB: string[];
    accepted: string[];
    stakePerParticipant: number;
  };
}

/* =========================================================
   ENGINE P2P INVITE WAGER (OFF-CHAIN COORDINATION)
========================================================= */

export interface EngineP2PInviteWager {
  id: string;

  style: "P2P_INVITE";

  creatorId: string;

  assertionType: AssertionType;
  declaredDirection: DeclaredDirection;

  description: string;
  line?: string;

  deadline: ISODateString;

  state: WagerState;

  exposure: ExposureBucket;

  resolution: Resolution;

  createdAt: ISODateString;

  p2p: {
    sideA: string[];
    sideB: string[];
    accepted: string[];
    stakePerParticipant: number;
  };
}

/* =========================================================
   ON-CHAIN P2P WAGER (CHAIN AUTHORITY)
========================================================= */

export interface ChainP2PWager {
  id: string; // escrowAddress
  escrowAddress: string;

  style: "P2P";

  creatorId: string;

  partyA: string;
  partyB: string;

  stakePerParticipant: number;

  deadline: ISODateString;
  createdAt: ISODateString;

  // 🔥 NEW — Raw chain truth
  chainState: number;
  disputeDeadline: number;
  proposedWinner: string;
  disputed: boolean;

  state: WagerState;
  resolution: Resolution;
}

/* =========================================================
   UNION — MASTER WAGER TYPE
========================================================= */

export type PreDEXWager =
  | OpenEngineWager
  | EngineP2PInviteWager
  | ChainP2PWager;

/* =========================
   COUNTER WAGER (OPEN ONLY)
========================= */

export interface CounterWager {
  id: string;

  parentWagerId: string;

  takerId: string;

  amount: number;

  lockedAt: ISODateString;

  resolved: boolean;

  outcome?: CounterWagerOutcome;
}

export type CounterWagerOutcome =
  | "CREATOR_WIN"
  | "TAKER_WIN"
  | "PUSH";

/* =========================
   ENGINE EVENTS (AUDIT LOG)
========================= */

export type PreDEXEvent =
  | {
    type: "WAGER_CREATED";
    wagerId: string;
    timestamp: ISODateString;
  }
  | {
    type: "COUNTER_WAGER_ACCEPTED";
    wagerId: string;
    counterWagerId: string;
    amount: number;
    timestamp: ISODateString;
  }
  | {
    type: "WAGER_LOCKED";
    wagerId: string;
    timestamp: ISODateString;
  }
  | {
    type: "WAGER_RESOLVED";
    wagerId: string;
    timestamp: ISODateString;
  };