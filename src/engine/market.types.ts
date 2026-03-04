import type { CourseContext } from "../wager/types";

/* =========================================================
   MARKET FORMAT
========================================================= */
export type MarketFormat =
   | "SINGLES"
   | "BEST_BALL_2";

/* =========================================================
   MARKET LIFECYCLE
========================================================= */
export type MarketStatus =
   | "draft"
   | "open"
   | "closed"
   | "pending"
   | "resolved"
   | "disputed";

/* =========================================================
   CONTESTANTS
========================================================= */

export type Contestant = {
   id: string;               // local UUID
   name: string;             // "First Last" — used for user matching
   metadata?: Record<string, unknown>;
};

export type ContestantUploadStatus =
   | "idle"
   | "parsing"
   | "error"
   | "ready";

export interface ContestantUploadMeta {
   status: ContestantUploadStatus;
   uploadedAt?: string;
   sourceName?: string;
   parsedCount?: number;
   error?: string;
}

/* =========================================================
   MARKET EXPOSURE RULES
========================================================= */
export interface MarketExposure {
   maxPerContract: number;
   maxTotalLiquidity?: number;
   creatorMaxExposure?: number;
}

/* =========================================================
   MARKET CONTRACT (MODELED OUTPUT)
========================================================= */

import type { MarketContract } from "../wager/types";

/* =========================================================
   MARKET MODEL (PARENT)
========================================================= */
export interface Market {
   id: string;

   creatorId: string;
   creatorUsername: string;

   format: MarketFormat;

   /* 🔥 FULL MODEL CONTEXT */
   courseContext: CourseContext;

   startTime: string;

   tileWagerIds: string[];

   exposure: MarketExposure;

   /* =========================
      CONTESTANTS
   ========================= */
   contestants?: Contestant[];
   contestantUpload?: ContestantUploadMeta;

   /* =========================
      GENERATED CONTRACTS
   ========================= */
   contracts?: MarketContract[];

   status: MarketStatus;

   createdAt: string;
}
