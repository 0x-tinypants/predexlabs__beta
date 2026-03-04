// src/state/useWagers.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Wager, DeclaredDirection } from "../wager";

import {
  submitClaim as submitEngineClaim,
} from "../engine/resolution.engine";

import {
  createWager as createEngineWager,
} from "../engine/wager.engine";

import type {
  ResolutionOutcome,
  PreDEXWager,
  OpenEngineWager,
  ChainP2PWager,
} from "../engine/predex.types";

import type { Market } from "../engine/market.types";

/**
 * ✅ Chain helpers (YOU MUST provide these in your codebase)
 * Expected shape:
 *  - getEscrow(address): returns an ethers Contract connected to the active signer
 *  - getProvider(): returns an ethers Provider (read-only ok)
 *
 * If your file exports differ, change these imports accordingly.
 */
import { getEscrow, getProvider } from "../blockchain/contracts";

/* =========================================================
   DIRECTION VALIDATION (OPEN BET ONLY)
========================================================= */

function validateDeclaredDirection(wager: Wager) {
  const { type, definition } = wager;
  const dir = definition.declaredDirection;

  if (type === "over_under") {
    if (dir !== "more" && dir !== "less") {
      throw new Error(
        "over_under wagers require declaredDirection = 'more' | 'less'"
      );
    }
  }

  if (type === "head_to_head") {
    if (dir !== "sideA" && dir !== "sideB") {
      throw new Error(
        "head_to_head wagers require declaredDirection = 'sideA' | 'sideB'"
      );
    }
  }
}

/* =========================================================
   OPPOSITE SIDE DERIVATION
========================================================= */

export function getOppositeDirection(
  declared: DeclaredDirection
): DeclaredDirection {
  switch (declared) {
    case "more":
      return "less";
    case "less":
      return "more";
    case "sideA":
      return "sideB";
    case "sideB":
      return "sideA";
    default:
      throw new Error("Invalid declaredDirection");
  }
}

/* =========================================================
   CHAIN P2P EXTENSION
   (kept local to avoid touching engine types yet)
========================================================= */

type ChainP2PFields = {
  // deterministic targeting
  escrowAddress: string;

  // identity
  partyA: string;
  partyB: string;

  // economics
  stakePerParticipantWei: string; // stored as string to avoid bigint serialization issues
  deadlineTs: number; // unix seconds

  // chain state
  chainState: number; // 0..5
  contractBalanceWei?: string;

  // provenance
  createdAtBlockTs?: number; // unix seconds, if available
};

// We keep PreDEXWager as the base type and add optional chain fields only for style==="P2P".
type AppWager = PreDEXWager & Partial<ChainP2PFields>;
/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const LS_MARKETS = "predex_markets";
const LS_P2P_INDEX = "predex_p2p_index_v1";

/* =========================================================
   UTIL: safe JSON parse
========================================================= */
function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* =========================================================
   WAGER STATE HOOK (CHAIN-BACKED P2P)
========================================================= */

export function useWagers() {
  const [wagers, setWagers] = useState<AppWager[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const syncingRef = useRef(false);

  /* =========================================================
     DEBUG (optional)
  ========================================================= */
  useEffect(() => {
    // eslint-disable-next-line no-console
  }, [wagers]);

  /* =========================================================
     PERSIST MARKETS
  ========================================================= */
  useEffect(() => {
    const stored = localStorage.getItem(LS_MARKETS);
    if (stored) setMarkets(safeParse(stored, [] as Market[]));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_MARKETS, JSON.stringify(markets));
  }, [markets]);

  /* =========================================================
     PERSIST P2P INDEX (just enough to resync from chain)
     We persist the minimal set required to reconstruct tiles:
     escrowAddress, partyA, partyB, stake, deadline, createdAtBlockTs (optional)
  ========================================================= */

  type P2PIndexRow = Pick<
    ChainP2PFields,
    | "escrowAddress"
    | "partyA"
    | "partyB"
    | "stakePerParticipantWei"
    | "deadlineTs"
    | "createdAtBlockTs"
  >;

  const p2pIndex: P2PIndexRow[] = useMemo(() => {
    return wagers
      .filter((w) => w.style === "P2P" && !!w.escrowAddress)
      .map((w) => ({
        escrowAddress: w.escrowAddress!,
        partyA: w.partyA || "",
        partyB: w.partyB || "",
        stakePerParticipantWei: w.stakePerParticipantWei || "0",
        deadlineTs: w.deadlineTs || 0,
        createdAtBlockTs: w.createdAtBlockTs,
      }));
  }, [wagers]);

  useEffect(() => {
    localStorage.setItem(LS_P2P_INDEX, JSON.stringify(p2pIndex));
  }, [p2pIndex]);

  /* =========================================================
     HYDRATE P2P INDEX ON MOUNT
     This rebuilds P2P tiles after refresh, then immediately syncs chain state.
  ========================================================= */
  useEffect(() => {
    const stored = safeParse<P2PIndexRow[]>(
      localStorage.getItem(LS_P2P_INDEX),
      []
    );

    if (!stored.length) return;

    setWagers((prev) => {
      // keep existing wagers; add missing escrows
      const existing = new Set(
        prev
          .filter((w) => w.style === "P2P" && w.escrowAddress)
          .map((w) =>
            w.style === "P2P" && w.escrowAddress
              ? w.escrowAddress.toLowerCase()
              : null
          )
          .filter(Boolean));

      const additions: AppWager[] = stored
        .filter((row) => !existing.has(row.escrowAddress.toLowerCase()))
        .map((row) => {
          const id = row.escrowAddress; // for chain wagers, id = escrowAddress

          const placeholder: ChainP2PWager & Partial<ChainP2PFields> = {
            // Required ChainP2PWager fields
            id,
            escrowAddress: row.escrowAddress,
            style: "P2P",
            creatorId: row.partyA || "unknown",

            partyA: row.partyA || "",
            partyB: row.partyB || "",

            stakePerParticipant: 0, // UI can derive from Wei field later
            deadline: new Date((row.deadlineTs || 0) * 1000).toISOString(),
            createdAt: new Date().toISOString(),

            chainState: 0,
            disputeDeadline: 0,
            proposedWinner: "",
            disputed: false,

            state: "OPEN" as any,
            resolution: { state: "PENDING", claims: [] },

            // Extra UI / chain helper fields
            stakePerParticipantWei: row.stakePerParticipantWei,
            deadlineTs: row.deadlineTs,
            createdAtBlockTs: row.createdAtBlockTs,
          };

          return placeholder as AppWager;
        });

      return [...additions, ...prev];
    });

    // Immediately sync after hydration
    // (we call via microtask to ensure state is set first)
    queueMicrotask(() => {
      void syncFromChain();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     CHAIN SYNC (single source of truth for P2P)
     Reads escrow.state() + basic metadata (best effort)
  ========================================================= */

  async function syncFromChain() {

    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const provider = getProvider();
      // snapshot current wagers at call-time
      const current = wagers;

      const updated = await Promise.all(
        current.map(async (w) => {
          if (w.style !== "P2P" || !w.escrowAddress) return w;

          try {
            const escrow = await getEscrow(w.escrowAddress);

            // Required
            const stateBn = await escrow.state();
            const chainState = Number(stateBn);

            // Optional reads (only if your escrow exposes them)
            // Use try/catch so we don't break if ABI differs.
            let contractBalanceWei: string | undefined;
            try {
              const bal = await provider.getBalance(w.escrowAddress);
              contractBalanceWei = bal.toString();
            } catch {
              // ignore
            }

            // Best-effort metadata (partyA/partyB/stake/deadline)
            // These should ideally exist in your contract ABI.
            let partyA = w.partyA;
            let partyB = w.partyB;
            let stakePerParticipantWei = w.stakePerParticipantWei;
            let deadlineTs = w.deadlineTs;

            try {
              // If these functions exist, they will overwrite placeholders.
              if (!partyA && escrow.partyA) partyA = await escrow.partyA();
              if (!partyB && escrow.partyB) partyB = await escrow.partyB();

              if (
                (!stakePerParticipantWei || stakePerParticipantWei === "0") &&
                escrow.stakeAmount
              ) {
                const stakeBn = await escrow.stakeAmount();
                stakePerParticipantWei = stakeBn.toString();
              }

              if ((!deadlineTs || deadlineTs === 0) && escrow.fundingDeadline) {
                const dlBn = await escrow.fundingDeadline();
                deadlineTs = Number(dlBn);
              }
            } catch {
              // ignore (ABI may not expose)
            }

            return {
              ...w,
              chainState,
              contractBalanceWei,
              partyA,
              partyB,
              stakePerParticipantWei,
              deadlineTs,
            };
          } catch (err) {
            // If escrow read fails, keep wager but do not crash UI
            // eslint-disable-next-line no-console
            console.warn("[syncFromChain] failed for", w.escrowAddress, err);
            return w;
          }
        })
      );

      setWagers(updated);
    } finally {
      syncingRef.current = false;
    }
  }

  /* =========================================================
     AUTO SYNC (polling)
     Chain-driven (not time-driven lifecycle). Keeps UI fresh.
  ========================================================= */
  useEffect(() => {
    const t = setInterval(() => {
      void syncFromChain();
    }, 8000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wagers.length]);

  /* =========================================================
     CREATE OPEN BET (UNCHANGED / OFF-CHAIN ENGINE)
  ========================================================= */
  function createWager(uiWager: Wager) {
    validateDeclaredDirection(uiWager);

    // eslint-disable-next-line no-console
    console.log("[STATE] createOpenBet", uiWager.id);

    const declared = uiWager.definition.declaredDirection;

    if (!declared) {
      throw new Error(
        `Engine received OPEN_BET without declaredDirection (id: ${uiWager.id})`
      );
    }

    const engineWager: Omit<OpenEngineWager, "resolution"> = {
      id: uiWager.id,
      creatorId: uiWager.creatorId,

      style: "OPEN_BET",

      assertionType:
        uiWager.type === "over_under"
          ? "self_performance"
          : "head_to_head",

      declaredDirection: declared,

      description: uiWager.definition.description,
      line: uiWager.definition.line,
      deadline: uiWager.definition.deadline,

      state: "OPEN",

      exposure: {
        maxExposure: uiWager.exposure.maxLoss,
        reservedExposure: 0,
        minPerCounterparty: uiWager.exposure.minPerParticipant,
        maxPerCounterparty: uiWager.exposure.maxPerParticipant,
      },

      createdAt: uiWager.createdAt,
    };

    setWagers((prev) => createEngineWager(prev as any, engineWager) as any);
  }

  /* =========================================================
     P2P — REGISTER A CHAIN ESCROW (creator already deployed via factory elsewhere)
     This is your clean bridge: UI can add a new escrow tile immediately,
     then we syncFromChain() to populate state.
  ========================================================= */
  function registerP2PEscrow(params: {
    escrowAddress: string;
    partyA: string;
    partyB: string;
    stakePerParticipantWei: string;
    deadlineTs: number;
    createdAtBlockTs?: number;
    description?: string;
  }) {
    // For chain wagers, id = escrowAddress (clean + deterministic)
    const id = params.escrowAddress;

    const placeholder: ChainP2PWager & Partial<ChainP2PFields> = {
      /* =========================
         Required ChainP2PWager Fields
      ========================== */

      id,
      escrowAddress: params.escrowAddress,
      style: "P2P",

      creatorId: params.partyA || "unknown",

      partyA: params.partyA,
      partyB: params.partyB,

      stakePerParticipant: 0, // you can later convert from Wei if needed

      deadline: new Date(params.deadlineTs * 1000).toISOString(),
      createdAt: new Date().toISOString(),

      chainState: 0,
      disputeDeadline: 0,
      proposedWinner: "",
      disputed: false,

      state: "OPEN" as any,
      resolution: { state: "PENDING", claims: [] },

      /* =========================
         Optional UI / Helper Fields
      ========================== */

      stakePerParticipantWei: params.stakePerParticipantWei,
      deadlineTs: params.deadlineTs,
      createdAtBlockTs: params.createdAtBlockTs,
    };

    setWagers((prev) => [placeholder as AppWager, ...prev]);

    // Immediately sync from chain so placeholder gets real state
    queueMicrotask(() => {
      void syncFromChain();
    });

    return id;
  }
  /* =========================================================
     P2P — ACCEPT (ON-CHAIN)
     This is the ONLY acceptance path.
     - modal opens (elsewhere)
     - confirm triggers this
     - ONE MetaMask popup
  ========================================================= */
  async function acceptP2POnChain(params: {
    escrowAddress: string;
    stakePerParticipantWei: string; // must be correct stake
  }) {
    const escrow = await getEscrow(params.escrowAddress);

    // Safety: do not spam reverts
    const stateBn = await escrow.state();
    if (Number(stateBn) !== 0) return;

    const tx = await escrow.deposit({
      value: BigInt(params.stakePerParticipantWei),
    });

    await tx.wait();
    await syncFromChain();
  }

  /* =========================================================
     CREATE MARKET (UNCHANGED)
  ========================================================= */
  function createMarket(params: {
    creatorId: string;
    creatorUsername: string;
    format: "SINGLES" | "BEST_BALL_2";
    courseContext: {
      courseName: string;
      courseLocation?: string;
      teeName: string;
      par: number;
      yardage: number;
    };
    startTime: string;
  }) {
    const newMarket: Market = {
      id: crypto.randomUUID(),
      creatorId: params.creatorId,
      creatorUsername: params.creatorUsername,
      format: params.format,

      courseContext: {
        courseName: params.courseContext.courseName,
        courseLocation: params.courseContext.courseLocation ?? "",
        teeName: params.courseContext.teeName,
        par: params.courseContext.par,
        yardage: params.courseContext.yardage,

        courseId: crypto.randomUUID(),
        courseRating: 72,
        slopeRating: 120,
        declaredBy: "creator",
      },

      startTime: params.startTime,

      tileWagerIds: [],

      // ✅ THIS WAS MISSING
      exposure: {
        maxPerContract: 1000,
        maxTotalLiquidity: undefined,
        creatorMaxExposure: undefined,
      },

      status: "draft",
      createdAt: new Date().toISOString(),
    };
    setMarkets((prev) => [newMarket, ...prev]);
    return newMarket;
  }

  /* =========================================================
     SUBMIT CLAIM (OPEN BET ONLY / ENGINE)
     NOTE: P2P claims should be moved to on-chain proposeWinner/finalize flow.
  ========================================================= */
  function submitClaim(params: {
    wagerId: string;
    claimantId: string;
    outcome: "WIN" | "LOSS";
  }) {
    // eslint-disable-next-line no-console
    console.log("[STATE] submitClaim called", params);

    const resolvedOutcome: ResolutionOutcome =
      params.outcome === "WIN" ? "CREATOR_WIN" : "COUNTERPARTY_WIN";

    setWagers((prev) =>
      submitEngineClaim(prev as any, {
        wagerId: params.wagerId,
        claimantId: params.claimantId,
        outcome: resolvedOutcome,
        timestamp: new Date().toISOString(),
      }) as any
    );
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  return {
    wagers,
    markets,

    // Market
    createMarket,

    // Open Bet (off-chain)
    createWager,

    // P2P (on-chain)
    registerP2PEscrow,  // add escrow tile from factory result
    acceptP2POnChain,   // deposit

    // Chain
    syncFromChain,

    // Shared
    submitClaim,
    getOppositeDirection,
  };
}