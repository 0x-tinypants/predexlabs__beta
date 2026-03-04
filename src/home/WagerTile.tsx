import OpenBetTile from "./OpenBetTile";
import P2PTile from "./P2PTile";
import type { Wager } from "../wager/types";

type Props = {
  wager: Wager;
  currentUserId: string;

  onQuickBet?: (intent: {
    wagerId: string;
    direction: "more" | "less" | "sideA" | "sideB";
  }) => void;

  // escrow-targeted (preferred)
  onAccept?: (escrowAddress: string) => void;
  onDecline?: (escrowAddress: string) => void;
  onSelectWinner?: (escrowAddress: string, winner: string) => void;
  onClaim?: (escrowAddress: string) => void; // ✅ NEW

  onOpenDetails?: () => void;
};

export default function WagerTile({
  wager,
  currentUserId,
  onQuickBet,
  onAccept,
  onDecline,
  onSelectWinner,
  onClaim, // ✅ NEW
  onOpenDetails,
}: Props) {
  const isP2P =
    wager.style === "P2P" ||
    wager.participants.mode === "p2p";

  if (isP2P) {
    return (
      <P2PTile
        wager={wager}
        viewerAddress={currentUserId}
        onAccept={onAccept}
        onDecline={onDecline}
        onSelectWinner={onSelectWinner}
        onClaim={onClaim} // ✅ correctly passed
        onOpenDetails={onOpenDetails}
      />
    );
  }

  return (
    <OpenBetTile
      wager={wager}
      currentUserId={currentUserId}
      onQuickBet={(direction) =>
        onQuickBet?.({
          wagerId: wager.id,
          direction,
        })
      }
      onOpenDetails={onOpenDetails}
    />
  );
}