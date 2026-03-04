import "./QuickBetContractModal.css";
import { useState, useEffect, useMemo } from "react";

import type { Wager } from "../wager";
import type { QuickBetIntent } from "../state/useQuickBetIntent";
import { getOppositeDirection } from "../state/useWagers";

import type { PreDEXWager, CounterWager } from "../engine/predex.types";

interface QuickBetContractModalProps {
  open: boolean;
  onClose: () => void;

  intent: QuickBetIntent | null;
  wagers: Wager[];

  engineWagers: PreDEXWager[];
  counterWagers: CounterWager[];

  onAccept: (
    wagerId: string,
    amount: number,
    takerId: string
  ) => void;

  //   // ✅ REQUIRED for handicap gating + correct takerId
  currentUser: {
    id: string;
    handicapIndex: number | null;
  };
}


export default function QuickBetContractModal({
  open,
  onClose,
  intent,
  wagers,
  engineWagers,
  onAccept,
  currentUser,
}: QuickBetContractModalProps) {

  /* -----------------------------
     LOCAL STATE
  ----------------------------- */
  const [amount, setAmount] = useState<string>("");

  // Reset amount whenever modal opens or wager changes
  useEffect(() => {
    if (open) setAmount("");
  }, [open, intent?.wagerId]);

  /* -----------------------------
     DERIVED DATA
  ----------------------------- */
  const wager = useMemo(() => {
    if (!intent) return undefined;
    return wagers.find(w => w.id === intent.wagerId);
  }, [wagers, intent]);

  const engineWager = useMemo(() => {
    if (!intent) return undefined;
    return engineWagers.find(w => w.id === intent.wagerId);
  }, [engineWagers, intent]);

  /* -----------------------------
     RENDER GUARDS
  ----------------------------- */
  if (!open || !intent) return null;
  if (!wager) return null;
  if (!engineWager) return null;

  /* -----------------------------
     CONTRACT LOGIC
  ----------------------------- */
  const creatorDirection = wager.definition.declaredDirection;
  const participantDirection = getOppositeDirection(creatorDirection);

  /* -----------------------------
    HANDICAP GATE (V2 - MARKET ONLY)
 ----------------------------- */

  // Only require handicap for Market-style wagers
  const isMarketWager = false;

  // In the future, this could be engineWager?.requiresHandicap === true
  const missingHandicap =
    isMarketWager &&
    currentUser.handicapIndex == null;

  const maxAllowed =
    wager.exposure.maxPerParticipant ?? wager.exposure.maxLoss;
  const minAllowed =
    wager.exposure.minPerParticipant ?? 1;

  const numericAmount = Number(amount);
  const isValidAmount =
    Number.isFinite(numericAmount) &&
    numericAmount >= minAllowed &&
    numericAmount <= maxAllowed;

  /* -----------------------------
     CREATOR SELF-GUARD
  ----------------------------- */

  const isCreator =
    currentUser.id === wager.creatorId;


  function renderBeliefStatement(
    w: Wager,
    actor: string,
    direction: string
  ) {
    if (w.type === "over_under") {
      return (
        <>
          {actor} believes the result will be{" "}
          <strong>{direction.toUpperCase()}</strong>{" "}
          {w.definition.line}
        </>
      );
    }

    if (w.type === "head_to_head") {
      return (
        <>
          {actor} believes{" "}
          <strong>
            {direction === "sideA"
              ? "the creator will win"
              : "the opponent will win"}
          </strong>
        </>
      );
    }

    return w.definition.description;
  }

  /* -----------------------------
     ACTION HANDLER
  ----------------------------- */
  function handleConfirm() {
    if (!intent) return;

    try {
      if (missingHandicap) {
        alert("Handicap Index required. Update your profile to participate.");
        return;
      }

      onAccept(
        intent.wagerId,
        numericAmount,
        currentUser.id
      );


      onClose();
    } catch (err) {
      console.error("Failed to place wager:", err);
      alert((err as Error).message);
    }
  }

  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <div className="quickbet-overlay" onClick={onClose}>
      <div
        className="quickbet-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="quickbet-title">Confirm Wager</div>
        <div className="quickbet-subtitle">
          Review and confirm the contract
        </div>

        {/* CONTRACT SUMMARY */}
        <div className="contract-summary">
          <div className="contract-row">
            <span className="label">Creator</span>
            <span className="value">@{wager.creatorUsername}</span>
          </div>

          <div className="contract-row">
            <span className="label">Event</span>
            <span className="value">{wager.eventName}</span>
          </div>

          <div className="contract-row">
            <span className="label">Category</span>
            <span className="value">
              {wager.context.category} · {wager.context.descriptor}
            </span>
          </div>

          <div className="contract-row condition">
            <span className="label">Creator Belief</span>
            <span className="value">
              {renderBeliefStatement(
                wager,
                wager.creatorUsername,
                creatorDirection
              )}
            </span>
          </div>

          <div className="contract-row condition inverse">
            <span className="label">Your Position</span>
            <span className="value">
              {renderBeliefStatement(
                wager,
                "You",
                participantDirection
              )}
            </span>
          </div>

          <div className="contract-row">
            <span className="label">Deadline</span>
            <span className="value">
              {new Date(
                wager.definition.deadline
              ).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="contract-row">
            <span className="label">Resolution</span>
            <span className="value">
              {wager.definition.resolutionLink
                ? "Verified via external source"
                : "Verified by participants"}
            </span>
          </div>
        </div>

        {/* DESCRIPTION */}
        {wager.definition.description && (
          <div className="contract-description">
            <span className="description-label">
              Additional details
            </span>
            {wager.definition.description}
          </div>
        )}

        {/* AMOUNT */}
        <div className="wager-amount">
          <label className="amount-label">Wager Amount</label>

          <input
            type="number"
            inputMode="decimal"
            placeholder={`$${minAllowed} – $${maxAllowed}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="amount-input"
          />

          <div className="amount-hint">
            You may wager between ${minAllowed} and ${maxAllowed}
          </div>
        </div>

        {missingHandicap && (
          <div className="handicap-warning">
            Handicap Index required for golf participation. Update your profile.
          </div>
        )}

        {isCreator && (
          <div className="creator-warning">
            You cannot accept your own wager.
          </div>
        )}

        {/* FOOTER */}
        <div className="quickbet-footer">
          <button
            className="confirm-button"
            disabled={
              !isValidAmount ||
              missingHandicap ||
              isCreator
            }
            onClick={handleConfirm}
          >
            Confirm Wager
          </button>

          <button
            className="quickbet-close"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
