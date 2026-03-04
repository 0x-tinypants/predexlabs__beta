/* =========================================================
   WAGER TYPES
========================================================= */

export type WagerType =
   | "over_under"
   | "head_to_head"
   | "group_pool"
   | "custom_rule"
   | "prediction";


export type ParticipationMode =
   | "open"
   | "p2p"
   | "direct"
   | "team";

/* =========================
   DECLARED DIRECTION
   Creator belief (FOUNDATIONAL)
========================= */
export type DeclaredDirection =
   | "more"

   | "less"
   | "sideA"
   | "sideB";

/* =========================================================
   COURSE CONTEXT
   Immutable snapshot at wager creation
========================================================= */

export interface CourseContext {
   courseId: string;

   courseName: string;
   courseLocation: string;

   teeName: string;

   par: number;
   yardage: number;

   courseRating: number;
   slopeRating: number;

   declaredBy: "creator";
}

/* =========================================================
   MARKET CONTRACT (HANDICAP-DRIVEN)
========================================================= */

export interface MarketContract {
   id: string;

   marketId: string;

   participantId: string;
   participantName: string;

   line: number; // Expected Gross Baseline (EG)

   createdAt: string;
}

/* =========================================================
   WAGER MODEL
========================================================= */

export interface Wager {
   id: string;

   creatorId: string;
   creatorUsername: string;

   type: WagerType;

   /* =========================
      EXPOSURE / LIMITS
   ========================= */
   exposure: {
      maxLoss: number;
      minPerParticipant?: number;
      maxPerParticipant?: number;
   };

   /* =========================
      CONTEXT
   ========================= */
   context: {
      category: string;   // Sports, Video Games, etc
      descriptor: string; // Golf, COD, Bitcoin, etc
   };

   /* =========================
      COURSE CONTEXT
      Immutable contract snapshot
   ========================= */
   courseContext?: CourseContext;

   /* =========================
      WAGER DEFINITION
      Belief + line + resolution
   ========================= */
   definition: {
      description: string;

      // Supporting data (NOT headline)
      line?: string;

      deadline: string; // ISO string

      // REQUIRED — creator belief
      declaredDirection: DeclaredDirection;

      // How outcome is verified
      resolutionLink?: string;
   };

   /* =========================
      PARTICIPATION
   ========================= */
   participants: {
      mode: ParticipationMode;
      invitedUserIds?: string[];
      teamUserIds?: string[];
   };

   /* =========================
      TOTALS
   ========================= */
   totals: {
      committed: number;
      remaining: number;
   };

   /* =========================
      STATUS
   ========================= */
   status: "open" | "locked" | "resolved";

   /* =========================
      RESOLUTION (ENGINE OUTPUT)
      UI READ-ONLY
   ========================= */
   resolution: {
      state:
      | "NONE"
      | "CLAIMABLE"
      | "PROPOSED"
      | "DISPUTED"
      | "RESOLVED";

      outcome?: "WIN" | "LOSS";
      resolvedAt?: string;
   };

   /* =========================
      MARKET CONTRACTS (NEW)
   ========================= */
   contracts?: MarketContract[];

   /* =========================
      VIEWER CONTEXT
      Derived in mapper — UI read-only
   ========================= */
   viewer: {
      isCreator: boolean;
      isParticipant: boolean;
      hasClaimed?: boolean;
   };

   /* =========================
      METADATA
   ========================= */
   createdAt: string;

   // Display / v1 convenience
   eventName: string;
   referenceLink?: string;

   /* =========================
    CHAIN P2P EXTENSION (v2)
    Optional — only used when style === "P2P"
 ========================= */
   style?: "OPEN_BET" | "P2P";

   escrowAddress?: string;

   chainState?: number;

   partyA?: string;
   partyB?: string;

   stakePerParticipantWei?: string;
   deadlineTs?: number;

   winner?: string;

   // 🔥 NEW
   disputeDeadline?: number;
   proposedWinner?: string;
   disputed?: boolean;

}