import { ethers } from "ethers";
import { getFactory, getEscrow } from "./contracts";
import { getWagerMetadataByEscrow } from "../services/wager.service";
import { recordResolvedWager } from "../services/history.service";
import type { PreDEXWager, WagerState } from "../engine/predex.types";

export async function syncFromChain({
  walletAddress,
  engineWagersRef,
  setEngineWagers,
  syncingRef
}: {
  walletAddress: string | null;
  engineWagersRef: React.MutableRefObject<PreDEXWager[]>;
  setEngineWagers: React.Dispatch<React.SetStateAction<PreDEXWager[]>>;
  syncingRef: React.MutableRefObject<boolean>;
}) {

  /* -------------------------------- */
  /* Prevent parallel sync */
  /* -------------------------------- */

  if (syncingRef.current) return;
  syncingRef.current = true;

  try {

    /* -------------------------------- */
    /* Provider detection */
    /* -------------------------------- */

    const injected =
      (window as any).web3authProvider ??
      (window as any).ethereum;

    if (!injected) return;

    const provider = new ethers.BrowserProvider(injected);

    const chainId = await provider.send("eth_chainId", []);

    /* Sepolia only */

    if (chainId !== "0xaa36a7") return;

    const factory = await getFactory();

    /* -------------------------------- */
    /* Block scanning */
    /* -------------------------------- */

    const latestBlock = await provider.getBlockNumber();

    let lastSyncedBlock = Number(
      localStorage.getItem("predex_last_synced_block")
    );

    if (!lastSyncedBlock) {
      lastSyncedBlock = Math.max(latestBlock - 20000, 0);
    }

    /* -------------------------------- */
    /* Fetch EscrowCreated events */
    /* -------------------------------- */

    const events = await factory.queryFilter(
      factory.filters.EscrowCreated(),
      lastSyncedBlock,
      latestBlock
    );

    const addresses = new Set<string>();

    for (const ev of events) {

      if (!("args" in ev)) continue;

      const addr = (ev.args.escrow as string)?.toLowerCase();

      if (addr) addresses.add(addr);

    }


    /* Include existing wagers */

    for (const w of engineWagersRef.current) {

      if (w.style === "P2P" && w.escrowAddress) {
        addresses.add(w.escrowAddress.toLowerCase());
      }

    }


    /* Save new sync point */

    localStorage.setItem(
      "predex_last_synced_block",
      (latestBlock - 5).toString()
    );

    if (addresses.size === 0) return;

    /* -------------------------------- */
    /* Read each escrow */
    /* -------------------------------- */

    const updated = await Promise.all(

      Array.from(addresses).map(async (escrowAddress) => {

        try {

          const escrow = await getEscrow(escrowAddress);

          const [
            partyA,
            partyB,
            stake,
            stateBn,
            fundingDeadline,
            disputeDeadline,
            proposedWinner,
            disputed
          ] = await Promise.all([
            escrow.partyA(),
            escrow.partyB(),
            escrow.stakeAmount(),
            escrow.state(),
            escrow.fundingDeadline(),
            escrow.disputeDeadline(),
            escrow.proposedWinner(),
            escrow.disputed()
          ]);

          /* Filter unrelated wagers */

          if (
            walletAddress &&
            walletAddress.toLowerCase() !== partyA.toLowerCase() &&
            walletAddress.toLowerCase() !== partyB.toLowerCase()
          ) {
            return null;
          }

          const chainState = Number(stateBn);

          /* -------------------------------- */
          /* Metadata lookup */
          /* -------------------------------- */

          let description = "Peer-to-Peer Wager";

          try {

            const metadata =
              await getWagerMetadataByEscrow(escrowAddress);

            if (metadata?.description) {
              description = metadata.description;
            }

          } catch { }

          /* -------------------------------- */
          /* Record resolved wagers */
          /* -------------------------------- */

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

            } catch { }

          }

          /* -------------------------------- */
          /* Convert timestamps */
          /* -------------------------------- */

          const deadlineISO = new Date(
            Number(fundingDeadline) * 1000
          ).toISOString();

          const createdISO = new Date(
            Number(fundingDeadline) * 1000
          ).toISOString();

          /* -------------------------------- */
          /* Return wager object */
          /* -------------------------------- */

          return {

            id: escrowAddress,
            escrowAddress,

            style: "P2P",

            creatorId: partyA,
            partyA,
            partyB,

            description,

            stakePerParticipant: Number(
              ethers.formatEther(stake)
            ),

            deadline: deadlineISO,
            createdAt: createdISO,

            chainState,
            disputeDeadline: Number(disputeDeadline),

            proposedWinner,
            disputed,

            state: chainState as unknown as WagerState,

            resolution: {
              state: "PENDING",
              claims: []
            }

          };

        } catch (err) {

          console.error(
            "Escrow read failed:",
            escrowAddress,
            err
          );

          return null;

        }

      })

    );

    const valid = updated.filter(Boolean) as PreDEXWager[];

    /* -------------------------------- */
    /* Merge into engine state */
    /* -------------------------------- */

    setEngineWagers((prev) => {
  const byEscrow = new Map<string, PreDEXWager>();

  for (const w of prev) {

    const key =
      (w as any).escrowAddress
        ? (w as any).escrowAddress.toLowerCase()
        : w.id.toLowerCase();

    byEscrow.set(key, w);
  }

  for (const w of valid) {

    const key =
      (w as any).escrowAddress
        ? (w as any).escrowAddress.toLowerCase()
        : w.id.toLowerCase();

    byEscrow.set(key, {
      ...(byEscrow.get(key) ?? {}),
      ...w
    });

  }

  return Array.from(byEscrow.values());
});


  } catch (err) {

    console.error("Chain sync failed:", err);

  } finally {

    syncingRef.current = false;

  }




}