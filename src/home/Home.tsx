import { useMemo, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getWagerMetadataByEscrow } from "../services/wager.service";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { createWagerRecord } from "../services/wager.service";

/* UI */
import FilterBar from "../filters/FilterBar";
import WagerSection from "./WagerSection";
import CreateWagerModal from "../wager/CreateWagerModal";
import QuickBetContractModal from "../quickBet/QuickBetContractModal";
import ResolvedColumn from "./ResolvedColumn";
import MarketTile from "./MarketTile";
import type { CombinedTile } from "./WagerSection";
import { recordResolvedWager } from "../services/history.service";
/* Types */
import type { Wager } from "../wager";
import type { PreDEXWager, CounterWager } from "../engine/predex.types";
/* Engine */
import { createWager } from "../engine/wager.engine";
import { acceptCounterWager } from "../engine/counterWager.engine";
import {
  submitClaim,
  evaluateWagerLifecycle,
} from "../engine/resolution.engine";

import type { Market } from "../engine/market.types";


/* State / Mappers */
import { useQuickBetIntent } from "../state/useQuickBetIntent";
import { mapPreDEXWagerToUI } from "../mappers/wager.mapper";
import type { WagerState } from "../engine/predex.types";
import {
  getFactory,
  getEscrow,
  FACTORY_ADDRESS
} from "../blockchain/contracts";
import { runTransaction } from "../blockchain/runTransaction";


export default function Home({
  currentUser,
}: {
  currentUser: string | null;
}) {

  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      setWalletAddress(accounts[0] ?? null);
    });

    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      setWalletAddress(accounts[0] ?? null);
    });
  }, []);

  const viewerUserId = currentUser?.toLowerCase() ?? null;

  const navigate = useNavigate();

  /* -----------------------------
   ENGINE STATE
----------------------------- */

  const [engineWagers, setEngineWagers] = useState<PreDEXWager[]>(() => {
    const stored = localStorage.getItem("predex_engine_wagers");
    return stored ? JSON.parse(stored) : [];
  });

  const engineWagersRef = useRef<PreDEXWager[]>(engineWagers);

  useEffect(() => {
    engineWagersRef.current = engineWagers;
  }, [engineWagers]);

  const syncingRef = useRef(false);

  const [counterWagers, setCounterWagers] = useState<CounterWager[]>(() => {
    const stored = localStorage.getItem("predex_counter_wagers");
    return stored ? JSON.parse(stored) : [];
  });

  const [engineMarkets, setEngineMarkets] = useState<Market[]>(() => {
    const stored = localStorage.getItem("predex_engine_markets");
    return stored ? JSON.parse(stored) : [];
  });

  /* -----------------------------
     UI STATE
  ----------------------------- */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /* Transaction loader */

  const { intent, openQuickBet, clearQuickBet } = useQuickBetIntent();
  const claimableStates = ["CLAIMABLE", "RESOLVING"] as const;

  /* -----------------------------
     ENGINE TICK (REAL TIME)
  ----------------------------- */
  useEffect(() => {
    const id = setInterval(() => {
      setEngineWagers((prev) =>
        prev.map((w) =>
          w.style === "P2P"
            ? w // 🔥 skip chain wagers
            : evaluateWagerLifecycle(w, new Date().toISOString())
        )
      );
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // 🔥 OUTSIDE useEffect
  async function syncFromChain() {
    if (!window.ethereum) return;

    // Prevent overlapping calls (interval + tx triggers)
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xaa36a7") return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = await getFactory();

      const latestBlock = await provider.getBlockNumber();

      let lastSyncedBlock = Number(localStorage.getItem("predex_last_synced_block"));
      if (!lastSyncedBlock) {
        lastSyncedBlock = Math.max(latestBlock - 50000, 0);
      }

      // 1) Get newly created escrows since last sync
      const events = await factory.queryFilter(
        factory.filters.EscrowCreated(),
        lastSyncedBlock,
        latestBlock
      );

      // 2) Build set of escrow addresses to refresh:
      //    - new ones from events
      //    - existing P2P ones already in state
      const addresses = new Set<string>();

      for (const ev of events) {
        if (!("args" in ev)) continue;
        const addr = ev.args.escrow as string;
        if (addr) addresses.add(addr);
      }

      for (const w of engineWagersRef.current) {
        if (w.style === "P2P" && w.escrowAddress) {
          addresses.add(w.escrowAddress);
        }
      }

      // Save checkpoint even if 0 events (otherwise you can re-scan same blocks)
      localStorage.setItem("predex_last_synced_block", (latestBlock - 5).toString());

      if (addresses.size === 0) return;

      // 3) Fetch on-chain data for each escrow and upsert into engine state
      const updated: PreDEXWager[] = [];


      for (const escrowAddress of addresses) {
        const escrow = await getEscrow(escrowAddress);

        const partyA = await escrow.partyA();
        const partyB = await escrow.partyB();

        // Keep your “only show wagers involving my wallet” logic
        if (
          walletAddress &&
          walletAddress.toLowerCase() !== partyA.toLowerCase() &&
          walletAddress.toLowerCase() !== partyB.toLowerCase()
        ) {
          continue;
        }

        const stake = await escrow.stakeAmount();
        const chainState = Number(await escrow.state());
        const fundingDeadline = await escrow.fundingDeadline();

        const disputeDeadline = Number(await escrow.disputeDeadline());
        const proposedWinner = await escrow.proposedWinner();
        const disputed = await escrow.disputed();

        /* -----------------------------------
           FETCH DESCRIPTION
        ----------------------------------- */

        let description = "Peer-to-Peer Wager";

        try {
          const metadata = await getWagerMetadataByEscrow(
            escrowAddress
          );

          if (metadata?.description) {
            description = metadata.description;
          }
        } catch (err) {
          console.error("Failed to fetch wager metadata", err);
        }

        /* -----------------------------------
           RECORD HISTORY IF RESOLVED
        ----------------------------------- */

        if (chainState === 4 && proposedWinner) {
          try {
            await recordResolvedWager({
              escrowAddress,
              winner: proposedWinner,
              partyA,
              partyB,
              stake: Number(ethers.formatEther(stake)),
              description
            });
          } catch (err) {
            console.error("History write failed:", err);
          }
        }

        /* -----------------------------------
           COMPUTE CREATED TIME
        ----------------------------------- */

        let createdAtISO =
          engineWagersRef.current.find(
            (w) => w.style === "P2P" && w.escrowAddress === escrowAddress
          )?.createdAt ?? null;

        if (!createdAtISO) {
          const block = await provider.getBlock(latestBlock);
          createdAtISO = block
            ? new Date(Number(block.timestamp) * 1000).toISOString()
            : new Date().toISOString();
        }

        const deadlineISO = new Date(
          Number(fundingDeadline) * 1000
        ).toISOString();

        /* -----------------------------------
           BUILD UPDATED WAGER OBJECT
        ----------------------------------- */

        updated.push({
          id: escrowAddress,
          escrowAddress,
          style: "P2P",
          creatorId: partyA,
          partyA,
          partyB,

          description,

          stakePerParticipant: Number(ethers.formatEther(stake)),
          deadline: deadlineISO,
          createdAt: createdAtISO,
          chainState,
          disputeDeadline,
          proposedWinner,
          disputed,

          state: chainState as unknown as WagerState,

          resolution: {
            state: "PENDING",
            claims: [],
          },
        });
      }

      // 4) UPSERT: replace existing P2P wagers by id, keep non-P2P wagers untouched
      setEngineWagers((prev) => {
        const byId = new Map<string, PreDEXWager>();

        // Start with previous wagers
        for (const w of prev) byId.set(w.id, w);

        // Upsert updated P2P
        for (const w of updated) byId.set(w.id, w);

        return Array.from(byId.values());
      });
    } catch (err) {
      console.error("Chain sync failed:", err);
    } finally {
      syncingRef.current = false;
    }
  }


  async function debugProfileHistory(wallet: string) {
    const snap = await getDocs(
      collection(db, "profiles", wallet.toLowerCase(), "history")
    );

    const rows: any[] = [];

    snap.forEach((doc) => {
      rows.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("HISTORY COUNT:", rows.length);
    console.table(rows);
  }
  /* -----------------------------
   LOCAL PERSISTENCE
----------------------------- */
  useEffect(() => {
    localStorage.setItem(
      "predex_engine_wagers",
      JSON.stringify(engineWagers)
    );
  }, [engineWagers]);

  useEffect(() => {
    localStorage.setItem(
      "predex_counter_wagers",
      JSON.stringify(counterWagers)
    );
  }, [counterWagers]);

  useEffect(() => {
    localStorage.setItem(
      "predex_engine_markets",
      JSON.stringify(engineMarkets)
    );
  }, [engineMarkets]);

  useEffect(() => {
  if (!walletAddress) return;

  syncFromChain();

  // DEBUG: inspect profile history
  debugProfileHistory(walletAddress);

}, [walletAddress]);
  /* -----------------------------
     CREATE WAGER
  ----------------------------- */
  function handleOpenCreate() {
    setActiveCategory("Sports");
    setShowCreateModal(true);
  }

  async function handleSubmitWager(payload: any) {

    console.log("SUBMIT PAYLOAD:", payload);

    if (!walletAddress) {
      console.error("Wallet not connected");
      return;
    }
    /* =============================
       MARKET SUBMISSION
    ============================= */

    const isMarket =
      payload &&
      typeof payload === "object" &&
      "format" in payload &&
      "courseContext" in payload &&
      "startTime" in payload &&
      "status" in payload;

    if (isMarket) {
      const newMarket: Market = {
        ...payload,
        creatorId: viewerUserId,
        creatorUsername: viewerUserId,
      };

      setEngineMarkets((prev) => [newMarket, ...prev]);
      setShowCreateModal(false);

      console.log("[STATE] Market created", newMarket);

      navigate(`/market/${newMarket.id}`);
      return;
    }

    /* =============================
       WAGER SUBMISSION
    ============================= */

    try {
      // =========================
      // P2P (BUILDER PATTERN)
      // =========================
      if (payload.style === "P2P") {
        try {

          if (!window.ethereum) {
            console.error("No wallet found");
            return;
          }

          const factory = await getFactory();

          const stakeInWei = ethers.parseEther(
            payload.stakePerParticipant.toString()
          );

          const tx = await factory.createEscrow(
            payload.sideB,
            stakeInWei,
            payload.deadline,
            { value: stakeInWei }
          );

          const receipt = await tx.wait();

          const event = receipt.logs
            .map((log: any) => {
              try {
                return factory.interface.parseLog(log);
              } catch {
                return null;
              }
            })
            .find((e: any) => e && e.name === "EscrowCreated");

          if (!event) {
            console.error("EscrowCreated event not found");
            return;
          }

          const escrowAddress = event.args.escrow;

          await createWagerRecord({
            escrowAddress: escrowAddress,
            description: payload.description,
            partyA: walletAddress,
            partyB: payload.sideB,
            stake: payload.stakePerParticipant,
            deadline: payload.deadline,
          });

          /* =========================================
             NEW — STORE DESCRIPTION LOCALLY
          ========================================= */

          localStorage.setItem(
            `predex_p2p_desc_${escrowAddress}`,
            payload.description ?? ""
          );

          /* ========================================= */

          // Create escrow contract instance
          const escrowContract = await getEscrow(escrowAddress);

          // Pull live chain data
          const chainState = await escrowContract.state();

          const proposedWinner = await escrowContract.proposedWinner();
          const winner = await escrowContract.winner();

          await syncFromChain();


        } catch (err) {
          console.error("P2P on-chain creation failed:", err);
        }
      }

      /* =========================
         OPEN / STANDARD
      ========================= */
      else {
        if (!payload?.definition?.declaredDirection) {
          console.error("[OPEN] Missing declaredDirection", payload);
          return;
        }

        setEngineWagers((prev) =>
          createWager(
            prev,
            {
              id: payload.id ?? crypto.randomUUID(),
              creatorId: viewerUserId,

              style: "OPEN_BET" as const,

              assertionType:
                payload.type === "head_to_head"
                  ? "head_to_head"
                  : "self_performance",

              declaredDirection:
                payload.definition.declaredDirection,

              description: payload.definition.description,
              line: payload.definition.line,
              deadline: payload.definition.deadline,

              state: "OPEN",

              exposure: {
                maxExposure: payload.exposure.maxLoss,
                reservedExposure: 0,
                minPerCounterparty:
                  payload.exposure.minPerParticipant,
                maxPerCounterparty:
                  payload.exposure.maxPerParticipant,
              },

              createdAt:
                payload.createdAt ?? new Date().toISOString(),

              resolution: {
                state: "PENDING",
                claims: [],
              },
            } as any
          )
        );
      }

      setShowCreateModal(false);

    } catch (err) {
      console.error("Invalid wager payload:", payload);
      console.error(err);
    }
  }
  /* -----------------------------
     COUNTER WAGER
  ----------------------------- */
  function handleAcceptCounterWager(
    wagerId: string,
    amount: number
  ) {
    if (!viewerUserId) return;

    const result = acceptCounterWager(
      engineWagers,
      counterWagers,
      {
        wagerId,
        takerId: viewerUserId,
        amount,
        timestamp: new Date().toISOString(),
      }
    );

    setEngineWagers(result.wagers);
    setCounterWagers(result.counterWagers);
  }

  function mapClaimIntentToOutcome(params: {
    wagerId: string;
    claimantId: string;
    intent: "WIN" | "LOSS";
  }) {
    const wager = engineWagers.find(
      (w) => w.id === params.wagerId
    );

    if (!wager) return;

    const isCreator =
      wager.creatorId === params.claimantId;

    if (params.intent === "WIN") {
      return isCreator
        ? "CREATOR_WIN"
        : "COUNTERPARTY_WIN";
    }

    // LOSS case
    return isCreator
      ? "COUNTERPARTY_WIN"
      : "CREATOR_WIN";
  }


  /* -----------------------------
   P2P ACCEPT / DECLINE
----------------------------- */

  async function handleAcceptP2P(wagerId: string) {
    try {
      if (!window.ethereum) return;

      const escrow = await getEscrow(wagerId);

      const wager = engineWagers.find((w) => w.id === wagerId);

      if (!wager || wager.style !== "P2P") {
        console.error("Invalid wager for deposit");
        return;
      }

      const stake = await escrow.stakeAmount();

      await runTransaction(
        escrow.deposit({ value: stake })
      );

    } catch (err) {
      console.error("Deposit failed:", err);
    }
  }


  function handleDeclineP2P() {
    console.log("Decline not supported on-chain");
  }


  async function handleSelectWinnerP2P(
    escrowAddress: string,
    winner: string
  ) {
    try {
      if (!window.ethereum) return;
      if (!winner) {
        console.error("No winner address provided");
        return;
      }

      const escrow = await getEscrow(escrowAddress);

      await runTransaction(
        escrow.proposeWinner(winner)
      );

      await syncFromChain();

      console.log("✅ Winner proposed:", winner);

    } catch (err) {
      console.error("❌ Propose winner failed:", err);
    } finally {
    }
  }


  async function handleClaimP2P(escrowAddress: string) {
    try {
      if (!window.ethereum) return;

      const escrow = await getEscrow(escrowAddress);

      console.log("Finalizing escrow:", escrowAddress);

      await runTransaction(
        escrow.finalize()
      );

      console.log("✅ Escrow finalized");

      await syncFromChain();

    } catch (err) {
      console.error("❌ Finalize failed:", err);
    } finally {
    }
  }

  /* -----------------------------
     CLAIM
  ----------------------------- */
  function handleSubmitClaim(
    wagerId: string,
    outcome: "CREATOR_WIN" | "COUNTERPARTY_WIN"
  ) {
    if (!viewerUserId) return;

    setEngineWagers((prev) =>
      submitClaim(prev, {
        wagerId,
        claimantId: viewerUserId,
        outcome,
        timestamp: new Date().toISOString(),
      })
    );
  }


  /* -----------------------------
     DEV RESET
  ----------------------------- */
  function resetAll() {
    localStorage.clear();
    setEngineWagers([]);
    setCounterWagers([]);
  }


  async function testJoinEscrow() {
    try {
      if (!window.ethereum) return;

      // Find first P2P wager
      const firstP2P = engineWagers.find(
        (w): w is any => w.style === "P2P"
      );

      if (!firstP2P) {
        console.error("No P2P wager found");
        return;
      }

      const escrowAddress = firstP2P.escrowAddress;

      const escrow = await getEscrow(escrowAddress);

      const stake = await escrow.stakeAmount();

      await runTransaction(
        escrow.deposit({ value: stake })
      );

      const updatedState = await escrow.state();

      // ✅ Properly update state
      setEngineWagers(prev =>
        prev.map(w => {
          if (
            w.style === "P2P" &&
            "escrowAddress" in w &&
            w.escrowAddress === escrowAddress
          ) {
            return {
              ...w,
              state: Number(updatedState) as unknown as WagerState
            };
          }
          return w;
        })
      );

      console.log("✅ Deposit confirmed");

    } catch (err) {
      console.error("❌ deposit failed:", err);
    }
  }


  /* -----------------------------
     DERIVED UI WAGERS
  ----------------------------- */
  const uiWagers: Wager[] = useMemo(() => {


    return [...engineWagers]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .map((engineWager) => {
        const relatedCounters = counterWagers.filter(
          (cw) => cw.parentWagerId === engineWager.id
        );

        return mapPreDEXWagerToUI({
          engineWager,
          counterWagers: relatedCounters,
          creatorUsername: engineWager.creatorId,
          eventName: "turlock city ncga",
          viewerUserId: walletAddress ?? "",
        });
      })
      .filter((w): w is Wager => w !== null);

  }, [engineWagers, counterWagers, viewerUserId]);

  /* -----------------------------
   PHASE 1 — UI HYGIENE SPLIT
----------------------------- */

  const activeWagers = useMemo(
    () =>
      uiWagers.filter(
        (w) =>
          w.resolution.state !== "CLAIMABLE" &&
          w.resolution.state !== "PROPOSED" &&
          w.resolution.state !== "DISPUTED" &&
          w.resolution.state !== "RESOLVED"
      ),
    [uiWagers]
  );

  const claimableWagers = useMemo(
    () =>
      uiWagers.filter(
        (w) =>
          w.resolution.state === "CLAIMABLE" ||
          w.resolution.state === "PROPOSED" ||
          w.resolution.state === "DISPUTED"
      ),
    [uiWagers]
  );

  const resolvedWagers = useMemo(
    () =>
      uiWagers.filter(
        (w) => w.resolution.state === "RESOLVED"
      ),
    [uiWagers]
  );

  /* -----------------------------
   DERIVED UI MARKETS
----------------------------- */

  const combinedTiles: CombinedTile[] = useMemo(() => {
    return [
      ...engineMarkets.map((m) => ({
        type: "MARKET" as const,
        data: m,
        createdAt: m.createdAt,
      })),
      ...activeWagers.map((w) => ({
        type: "WAGER" as const,
        data: w,
        createdAt: w.createdAt,
      })),
    ].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [engineMarkets, activeWagers]);


  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <>
      <div className="content-rail content-rail--full">

        <FilterBar
          onCreate={handleOpenCreate}
        />
        <WagerSection
          title="Sports"
          wagers={combinedTiles}
          currentUserId={walletAddress ?? ""}
          onQuickBet={openQuickBet}
          onAcceptP2P={handleAcceptP2P}
          onDeclineP2P={handleDeclineP2P}
          onSelectWinnerP2P={handleSelectWinnerP2P}
          onClaimP2P={handleClaimP2P}
        />


        {showCreateModal && activeCategory && (
          <CreateWagerModal
            category={activeCategory}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleSubmitWager}
          />
        )}

        <QuickBetContractModal
          open={!!intent}
          onClose={clearQuickBet}
          intent={intent}
          wagers={uiWagers}
          engineWagers={engineWagers}
          counterWagers={counterWagers}
          onAccept={handleAcceptCounterWager}
          currentUser={{
            id: viewerUserId ?? "",
            handicapIndex: null,
          }}
        />


        <button
          style={{
            marginTop: 24,
            padding: 8,
            background: "#300",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
          onClick={resetAll}
        >
          Reset All (Dev)
        </button>

        <ResolvedColumn wagers={resolvedWagers} />

      </div>
    </>
  );
}
