import type { Wager } from "../wager/types";
import type { DeclaredDirection } from "../wager/types";
import { getOppositeDirection } from "../state/useWagers";
import TileShell from "../ui/tile/TileShell";
import "./openBetTile.css";

type Props = {
  wager: Wager;
  currentUserId: string; // ✅ add this
  onQuickBet?: (direction: DeclaredDirection) => void;
  onOpenDetails?: () => void;
};

export default function OpenBetTile({
  wager,
  currentUserId,
  onQuickBet,
  onOpenDetails,
}: Props) {
  const {
    id,
    creatorUsername,
    definition,
    exposure,
    totals,
    eventName,
    resolution,
  } = wager;

  const declaredDirection = definition.declaredDirection;
  const opposite = getOppositeDirection(declaredDirection);

  const maxExposure = exposure.maxLoss;
  const committed = totals.committed;

  const percentFilled =
    maxExposure > 0
      ? Math.min((committed / maxExposure) * 100, 100)
      : 0;

  const stage =
    resolution.state === "RESOLVED"
      ? "RESOLVED"
      : resolution.state === "CLAIMABLE"
        ? "CLAIMABLE"
        : wager.status === "locked"
          ? "LOCKED"
          : "OPEN";

  // ✅ Prevent creator from joining their own wager
 // ✅ Prevent creator from joining their own wager
const isCreator =
  currentUserId === wager.creatorId;

const canJoin =
  stage === "OPEN" &&
  totals.remaining > 0 &&
  !isCreator;

  function handleSideSelect(
    e: React.MouseEvent,
    dir: DeclaredDirection
  ) {
    e.stopPropagation();
    onQuickBet?.(dir);
  }

  return (
    <TileShell
      className="open-bet-tile tile-shell--open_bet"
      onClick={onOpenDetails}
      header={
        <div className="open-header">
          <div className="open-title">
            {definition.description}
          </div>
          <div className={`state-badge ${stage}`}>
            {stage}
          </div>
        </div>
      }
      meta={
        <div className="open-meta">
          <div className="open-meta-left">
            <div className="open-circle meta-circle" />
            <span>by {creatorUsername}</span>
          </div>

          <span className="open-meta-time">
            ⏱{" "}
            {new Date(
              definition.deadline
            ).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      }
    >
      <div className="open-context">{eventName}</div>

      <div className="open-target-line">
        {definition.line ?? "-"}
      </div>

      <div
        className="open-direction-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Creator side */}
        <button
          className={`dir ${declaredDirection} ${!isCreator ? "active" : ""}`}
          disabled
        >
          {declaredDirection.toUpperCase()}
        </button>

        {/* Counter side */}
        <button
          className={`dir ${!isCreator ? "selectable" : ""}`}
          disabled={!canJoin}
          onClick={(e) => {
            if (!canJoin) return;
            handleSideSelect(e, opposite);
          }}
        >
          {opposite.toUpperCase()}
        </button>
      </div>

      <div className="open-exposure">
        <div className="open-exposure-top">
          <div className="open-exposure-label">
            ${committed} / ${maxExposure}
          </div>

          <div className="open-participants">
            <div className="open-circle" />
            <div className="open-circle" />
            <div className="open-circle" />
            <div className="open-circle extra">
              +2
            </div>
          </div>
        </div>

        <div className="open-exposure-bar">
          <div
            className="open-exposure-fill"
            style={{
              width: `${percentFilled}%`,
            }}
          />
        </div>
      </div>
    </TileShell>
  );
}