import type { PreDEXWager, CounterWager } from "./predex.types";

/* =========================================================
   Helpers
========================================================= */

function hasAlreadyCountered(params: {
  counterWagers: CounterWager[];
  wagerId: string;
  takerId: string;
}): boolean {
  const { counterWagers, wagerId, takerId } = params;

  return counterWagers.some(
    (cw) =>
      cw.parentWagerId === wagerId &&
      cw.takerId === takerId
  );
}

/* =========================================================
   ACCEPT COUNTER WAGER (PURE)
========================================================= */

export function acceptCounterWager(
  wagers: PreDEXWager[],
  counterWagers: CounterWager[],
  input: {
    wagerId: string;
    takerId: string;
    amount: number;
    timestamp: string;
  }
): {
  wagers: PreDEXWager[];
  counterWagers: CounterWager[];
} {
  const wager = wagers.find((w) => w.id === input.wagerId);
  if (!wager) {
    throw new Error("Wager not found");
  }

  // 1) Must be OPEN
  if (wager.state !== "OPEN") {
    throw new Error("Wager is not open");
  }

  // 2) Deadline must not be passed (safety net)
  if (wager.deadline <= input.timestamp) {
    throw new Error("Wager deadline has passed");
  }

  // 3) Creator can never counter own wager (OPEN_BET)
  if (
    wager.style === "OPEN_BET" &&
    input.takerId === wager.creatorId
  ) {
    throw new Error("Creator cannot counter own Open Bet");
  }

  // 4) Taker can only counter once (CRITICAL)
  if (
    hasAlreadyCountered({
      counterWagers,
      wagerId: wager.id,
      takerId: input.takerId,
    })
  ) {
    throw new Error("User already countered this wager");
  }

  // 5) Validate amount
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Invalid counter amount");
  }

  const remaining =
    wager.exposure.maxExposure -
    wager.exposure.reservedExposure;

  if (input.amount > remaining) {
    throw new Error("Insufficient exposure available");
  }

  // 6) Create counter wager
  const counterWager: CounterWager = {
    id: crypto.randomUUID(),
    parentWagerId: wager.id,
    takerId: input.takerId,
    amount: input.amount,
    lockedAt: input.timestamp,
    resolved: false,
  };

  const newReserved =
    wager.exposure.reservedExposure + input.amount;

  const updatedWager: PreDEXWager = {
    ...wager,
    exposure: {
      ...wager.exposure,
      reservedExposure: newReserved,
    },
    state:
      newReserved >= wager.exposure.maxExposure
        ? "LOCKED"
        : wager.state,
  };

  return {
    wagers: wagers.map((w) =>
      w.id === wager.id ? updatedWager : w
    ),
    counterWagers: [counterWager, ...counterWagers],
  };
}
