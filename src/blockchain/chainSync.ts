import { ethers } from "ethers";
import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from "react";

import { getFactory, getEscrow } from "./contracts";
import { getWagerMetadataByEscrow } from "../services/wager.service";
import { recordResolvedWager } from "../services/history.service";
import { logger } from "../dev/logger";
import { logLifecycle } from "../dev/lifecycleLogger";
import type { PreDEXWager, WagerState } from "../engine/predex.types";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const SYNC_POINTER_KEY = "predex_last_synced_block";

const INITIAL_LOOKBACK = 20000;
const REORG_BUFFER = 500;
/* -------------------------------------------------- */
/* Provider */
/* -------------------------------------------------- */

function getProvider(): any | null {
  return (
    (window as any).web3authProvider ??
    (window as any).ethereum ??
    null
  );
}

function normalize(addr: string | null | undefined) {
  return (addr ?? "").toLowerCase();
}

/* -------------------------------------------------- */
/* Load Escrow Snapshot */
/* -------------------------------------------------- */

async function loadEscrow(
  escrowAddress: string,
  walletAddress: string | null
) {

  const escrow = await getEscrow(escrowAddress);

  const [
    partyA,
    partyB,
    stakeBn,
    stateBn,
    fundingDeadlineBn,
    disputeDeadlineBn,
    proposedWinner,
    disputed,
  ] = await Promise.all([
    escrow.partyA(),
    escrow.partyB(),
    escrow.stakeAmount(),
    escrow.state(),
    escrow.fundingDeadline(),
    escrow.disputeDeadline(),
    escrow.proposedWinner(),
    escrow.disputed(),
  ]);

  /*
if (
  walletAddress &&
  normalize(walletAddress) !== normalize(partyA) &&
  normalize(walletAddress) !== normalize(partyB)
) {
  return null;
}
*/

  let description = "Peer-to-Peer Wager";

  try {
    const metadata = await getWagerMetadataByEscrow(escrowAddress);
    if (metadata?.description) {
      description = metadata.description;
    }
  } catch {
    logger.warn("metadata lookup failed", escrowAddress);
  }

  return {
    escrowAddress: normalize(escrowAddress),
    partyA,
    partyB,
    stakePerParticipant: Number(ethers.formatEther(stakeBn)),
    chainState: Number(stateBn),
    fundingDeadline: Number(fundingDeadlineBn),
    disputeDeadline: Number(disputeDeadlineBn),
    proposedWinner,
    disputed,
    description,
  };
}

/* -------------------------------------------------- */
/* Convert Snapshot → Engine Wager */
/* -------------------------------------------------- */

function toEngineWager(snapshot: any): PreDEXWager {

  return {
    id: snapshot.escrowAddress,
    escrowAddress: snapshot.escrowAddress,

    style: "P2P",

    creatorId: snapshot.partyA,
    partyA: snapshot.partyA,
    partyB: snapshot.partyB,

    description: snapshot.description,

    stakePerParticipant: snapshot.stakePerParticipant,

    deadline: new Date(
      snapshot.fundingDeadline * 1000
    ).toISOString(),

    createdAt: new Date(
      snapshot.fundingDeadline * 1000
    ).toISOString(),

    chainState: snapshot.chainState,
    disputeDeadline: snapshot.disputeDeadline,

    proposedWinner: snapshot.proposedWinner,
    disputed: snapshot.disputed,

    state: snapshot.chainState as unknown as WagerState,

    resolution: {
      state: "PENDING",
      claims: [],
    },
  };
}

/* -------------------------------------------------- */
/* Sync Engine From Chain */
/* -------------------------------------------------- */

export async function syncFromChain({
  walletAddress,
  engineWagersRef,
  setEngineWagers,
  syncingRef,
}: {
  walletAddress: string | null;
  engineWagersRef: MutableRefObject<PreDEXWager[]>;
  setEngineWagers: Dispatch<SetStateAction<PreDEXWager[]>>;
  syncingRef: MutableRefObject<boolean>;
}) {

  if (syncingRef.current) return;
  syncingRef.current = true;

  try {

    const injected = getProvider();

    if (!injected) {
      logger.wallet("no provider found");
      return;
    }

    const provider = new ethers.BrowserProvider(injected);

    const chainId = await provider.send("eth_chainId", []);

    if (chainId !== SEPOLIA_CHAIN_ID) {
      logger.sync("wrong network", chainId);
      return;
    }

    const latestBlock = await provider.getBlockNumber();

    const savedPointer = Number(
      localStorage.getItem(SYNC_POINTER_KEY) ?? 0
    );

    const fromBlock =
      savedPointer > 0
        ? Math.max(savedPointer - REORG_BUFFER, 0)
        : Math.max(latestBlock - INITIAL_LOOKBACK, 0);

    logger.sync("scan", { fromBlock, latestBlock });

    const factory = await getFactory();

    const events = await factory.queryFilter(
      factory.filters.EscrowCreated(),
      fromBlock,
      latestBlock
    );

    const escrowAddresses = new Set<string>();

    for (const ev of events) {

      if (!("args" in ev)) continue;

      const escrow = normalize(ev.args.escrow);

      if (escrow) {

        escrowAddresses.add(escrow);

        logLifecycle("CHAIN_EVENT_FOUND", escrow);

      }

    }

    /* also refresh already known wagers */

    for (const w of engineWagersRef.current) {

      if (w.style === "P2P" && w.escrowAddress) {
        escrowAddresses.add(normalize(w.escrowAddress));
      }

    }

    if (escrowAddresses.size === 0) {

      localStorage.setItem(
        SYNC_POINTER_KEY,
        latestBlock.toString()
      );

      logger.sync("no escrows");

      return;
    }

    const snapshots = await Promise.all(

      Array.from(escrowAddresses).map((addr) =>
        loadEscrow(addr, walletAddress)
      )

    );

    const wagers = snapshots
      .filter(Boolean)
      .map((snap) => toEngineWager(snap));

    setEngineWagers((prev) => {

      const map = new Map<string, PreDEXWager>();

      for (const w of prev) {
        if (w.style === "P2P" && w.escrowAddress) {
          map.set(normalize(w.escrowAddress), w);
        }
      }

      for (const w of wagers) {
        if (w.style === "P2P" && w.escrowAddress) {

          const key = normalize(w.escrowAddress);
          const existing = map.get(key);

          map.set(key, {
            ...(existing || {}),
            ...w,
          });

        }
      }

      return Array.from(map.values());

    });

    /* update sync pointer */

    localStorage.setItem(
      SYNC_POINTER_KEY,
      latestBlock.toString()
    );

    logger.sync("sync complete", {
      escrows: wagers.length,
      latestBlock,
    });

  } finally {

    syncingRef.current = false;

  }
}