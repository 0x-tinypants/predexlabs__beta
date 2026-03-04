import type {
  PreDEXWager,
  CounterWager,
} from "./predex.types";

/* =========================================================
   Types
========================================================= */

export interface LedgerEntry {
  userId: string;
  amount: number; // positive = credit, negative = debit
  reason: string;
}

export interface PayoutResult {
  ledger: LedgerEntry[];
  protocolFeeTotal: number;
}

/* =========================================================
   Config (v0)
========================================================= */

const PROTOCOL_FEE_RATE = 0.01; // 1%

/* =========================================================
   Helpers
========================================================= */

function calculateFee(amount: number): number {
  return Math.round(amount * PROTOCOL_FEE_RATE * 100) / 100;
}

/* =========================================================
   Main: Calculate Payouts
========================================================= */

export function calculatePayouts(params: {
  wager: PreDEXWager;
  counterWagers: CounterWager[];
}): PayoutResult {
  const { wager, counterWagers } = params;

  const ledger: LedgerEntry[] = [];
  let protocolFeeTotal = 0;

  for (const cw of counterWagers) {
    if (!cw.resolved || !cw.outcome) {
      throw new Error("Counter-wager is not resolved");
    }

    const amount = cw.amount;

    switch (cw.outcome) {
      case "CREATOR_WIN": {
        const fee = calculateFee(amount);
        protocolFeeTotal += fee;

        // Taker loses stake
        ledger.push({
          userId: cw.takerId,
          amount: -amount,
          reason: "Lost counter-wager",
        });

        // Creator wins stake minus fee
        ledger.push({
          userId: wager.creatorId,
          amount: amount - fee,
          reason: "Won counter-wager",
        });

        break;
      }

      case "TAKER_WIN": {
        const fee = calculateFee(amount);
        protocolFeeTotal += fee;

        // Creator loses stake
        ledger.push({
          userId: wager.creatorId,
          amount: -amount,
          reason: "Lost counter-wager",
        });

        // Taker wins stake minus fee
        ledger.push({
          userId: cw.takerId,
          amount: amount - fee,
          reason: "Won counter-wager",
        });

        break;
      }

      case "PUSH": {
        // Refund both sides
        ledger.push({
          userId: cw.takerId,
          amount: 0,
          reason: "Push — no change",
        });

        ledger.push({
          userId: wager.creatorId,
          amount: 0,
          reason: "Push — no change",
        });

        break;
      }

      default:
        throw new Error("Unknown counter-wager outcome");
    }
  }

  return {
    ledger,
    protocolFeeTotal,
  };
}
