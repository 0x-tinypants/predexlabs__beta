import { ethers } from "ethers";

import { createWager } from "../engine/wager.engine";
import { acceptCounterWager } from "../engine/counterWager.engine";
import { submitClaim } from "../engine/resolution.engine";

import { createWagerRecord } from "../services/wager.service";

import { getFactory, getEscrow } from "../blockchain/contracts";
import { runTransaction } from "../blockchain/runTransaction";

import type { Market } from "../engine/market.types";
import type { PreDEXWager, CounterWager } from "../engine/predex.types";

type Props = {
  walletAddress: string | null;
  viewerUserId: string | null;
  engineWagers: PreDEXWager[];
  setEngineWagers: React.Dispatch<React.SetStateAction<PreDEXWager[]>>;
  counterWagers: CounterWager[];
  setCounterWagers: React.Dispatch<React.SetStateAction<CounterWager[]>>;
  setEngineMarkets: React.Dispatch<React.SetStateAction<Market[]>>;
  runSync: () => Promise<void>;
};

export function useWagerActions({
  walletAddress,
  viewerUserId,
  engineWagers,
  setEngineWagers,
  counterWagers,
  setCounterWagers,
  setEngineMarkets,
  runSync,
}: Props) {

  let creatingWager = false;

  async function handleSubmitWager(payload: any) {

    if (creatingWager) {
      console.warn("Wager already being created");
      return;
    }

    creatingWager = true;

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
      return;
    }

    try {
      if (payload.style === "P2P") {
        if (!window.ethereum) return;

        const factory = await getFactory();

        const stakeInWei = ethers.parseEther(
          payload.stakePerParticipant.toString()
        );

        const tx = await runTransaction(
          factory.createEscrow(payload.sideB, stakeInWei, payload.deadline, {
            value: stakeInWei,
          })
        );

        if (!tx) return;

        const receipt = await tx.wait();
        await runSync();

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

        const escrowAddress = (event as any).args.escrow as string;

        await createWagerRecord({
          escrowAddress,
          description: payload.description,
          partyA: walletAddress,
          partyB: payload.sideB,
          stake: payload.stakePerParticipant,
          deadline: payload.deadline,
        });

        localStorage.setItem(
          `predex_p2p_desc_${escrowAddress}`,
          payload.description ?? ""
        );
      } else {
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

              declaredDirection: payload.definition.declaredDirection,
              description: payload.definition.description,
              line: payload.definition.line,
              deadline: payload.definition.deadline,

              state: "OPEN",

              exposure: {
                maxExposure: payload.exposure.maxLoss,
                reservedExposure: 0,
                minPerCounterparty: payload.exposure.minPerParticipant,
                maxPerCounterparty: payload.exposure.maxPerParticipant,
              },

              createdAt: payload.createdAt ?? new Date().toISOString(),

              resolution: {
                state: "PENDING",
                claims: [],
              },
            } as any
          )
        );
      }
    } catch (err) {
      console.error("handleSubmitWager failed:", err);
    } finally {
      creatingWager = false;
    }
  }

  function handleAcceptCounterWager(wagerId: string, amount: number) {
    if (!viewerUserId) return;

    const result = acceptCounterWager(engineWagers, counterWagers, {
      wagerId,
      takerId: viewerUserId,
      amount,
      timestamp: new Date().toISOString(),
    });

    setEngineWagers(result.wagers);
    setCounterWagers(result.counterWagers);
  }

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

      const tx = await runTransaction(
        escrow.deposit({ value: stake })
      );

      if (tx) {
        await tx.wait();
        await runSync();
      }

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

      const tx = await runTransaction(
        escrow.proposeWinner(winner)
      );

      if (tx) {
        await tx.wait();
        await runSync();
      }

    } catch (err) {
      console.error("Propose winner failed:", err);
    }
  }

  async function handleClaimP2P(escrowAddress: string) {
    try {
      if (!window.ethereum) return;

      const escrow = await getEscrow(escrowAddress);

      const tx = await runTransaction(
        escrow.finalize()
      );

      if (tx) {
        await tx.wait();
        await runSync();
      }

    } catch (err) {
      console.error("Finalize failed:", err);
    }
  }

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

  return {
    handleSubmitWager,
    handleAcceptCounterWager,
    handleAcceptP2P,
    handleDeclineP2P,
    handleSelectWinnerP2P,
    handleClaimP2P,
    handleSubmitClaim,
  };
}