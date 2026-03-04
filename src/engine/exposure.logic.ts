import type { ExposureBucket } from "./predex.types";

/* =========================================================
   Exposure Invariants
========================================================= */

/**
 * Remaining exposure available for new counter-wagers
 */
export function remainingExposure(exposure: ExposureBucket): number {
  return exposure.maxExposure - exposure.reservedExposure;
}

/**
 * Validate whether an amount is allowed for a single counterparty
 */
export function isValidCounterAmount(
  exposure: ExposureBucket,
  amount: number
): boolean {
  if (amount <= 0) return false;

  if (
    exposure.minPerCounterparty !== undefined &&
    amount < exposure.minPerCounterparty
  ) {
    return false;
  }

  if (
    exposure.maxPerCounterparty !== undefined &&
    amount > exposure.maxPerCounterparty
  ) {
    return false;
  }

  return true;
}

/**
 * Check if exposure can be reserved
 */
export function canReserveExposure(
  exposure: ExposureBucket,
  amount: number
): boolean {
  if (!isValidCounterAmount(exposure, amount)) return false;

  return amount <= remainingExposure(exposure);
}

/**
 * Reserve exposure for a new counter-wager
 * (PURE — returns a new bucket)
 */
export function reserveExposure(
  exposure: ExposureBucket,
  amount: number
): ExposureBucket {
  if (!canReserveExposure(exposure, amount)) {
    throw new Error("Exposure reservation exceeds limits");
  }

  return {
    ...exposure,
    reservedExposure: exposure.reservedExposure + amount,
  };
}

/**
 * Release exposure (used for cancellations / failed matches)
 */
export function releaseExposure(
  exposure: ExposureBucket,
  amount: number
): ExposureBucket {
  if (amount <= 0) {
    throw new Error("Release amount must be positive");
  }

  if (amount > exposure.reservedExposure) {
    throw new Error("Cannot release more exposure than reserved");
  }

  return {
    ...exposure,
    reservedExposure: exposure.reservedExposure - amount,
  };
}

/**
 * Check if exposure is fully utilized
 */
export function isExposureFilled(exposure: ExposureBucket): boolean {
  return exposure.reservedExposure >= exposure.maxExposure;
}
