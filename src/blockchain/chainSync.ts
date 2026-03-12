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

  if (!window.ethereum) return;

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

    const events = await factory.queryFilter(
      factory.filters.EscrowCreated(),
      lastSyncedBlock,
      latestBlock
    );

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

    localStorage.setItem(
      "predex_last_synced_block",
      (latestBlock - 5).toString()
    );

    if (addresses.size === 0) return;

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

          if (
            walletAddress &&
            walletAddress.toLowerCase() !== partyA.toLowerCase() &&
            walletAddress.toLowerCase() !== partyB.toLowerCase()
          ) {
            return null;
          }

          const chainState = Number(stateBn);

          let description = "Peer-to-Peer Wager";

          try {
            const metadata = await getWagerMetadataByEscrow(escrowAddress);
            if (metadata?.description) {
              description = metadata.description;
            }
          } catch {}

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
            } catch {}
          }

          const deadlineISO = new Date(
            Number(fundingDeadline) * 1000
          ).toISOString();

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
            createdAt: new Date().toISOString(),
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
          console.error("Escrow read failed:", escrowAddress, err);
          return null;
        }

      })
    );

    const valid = updated.filter(Boolean) as PreDEXWager[];

    setEngineWagers((prev) => {

      const byId = new Map<string, PreDEXWager>();

      for (const w of prev) {
        byId.set(w.id, w);
      }

      for (const w of valid) {
        byId.set(w.id, w);
      }

      return Array.from(byId.values());

    });

  } catch (err) {

    console.error("Chain sync failed:", err);

  } finally {

    syncingRef.current = false;

  }

}