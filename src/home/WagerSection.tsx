// src/home/WagerSection.tsx

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import WagerTile from "./WagerTile";
import MarketTile from "./MarketTile";
import EscrowDetailModal from "../components/escrow/EscrowDetailModal";
import "./wagerSection.css";

import type { Wager } from "../wager/types";
import type { Market } from "../engine/market.types";

type QuickBetIntent = {
  wagerId: string;
  direction: "more" | "less" | "sideA" | "sideB";
};

export type CombinedTile =
  | {
      type: "MARKET";
      data: Market;
      createdAt: string;
    }
  | {
      type: "WAGER";
      data: Wager;
      createdAt: string;
    };

export default function WagerSection({
  title,
  wagers,
  currentUserId,
  onQuickBet,
  onAcceptP2P,
  onDeclineP2P,
  onSelectWinnerP2P,
  onClaimP2P,
}: {
  title: string;
  wagers: CombinedTile[];
  currentUserId: string;

  onQuickBet: (intent: QuickBetIntent) => void;
  onAcceptP2P?: (escrowAddress: string) => void;
  onDeclineP2P?: (escrowAddress: string) => void;
  onSelectWinnerP2P?: (escrowAddress: string, winner: string) => void;
  onClaimP2P?: (escrowAddress: string) => void;
}) {

  const navigate = useNavigate();

  /*
  =====================================
  MODAL STATE (NEW)
  =====================================
  */
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);

  /*
  =====================================
  DEBUG: Inspect wager structure
  =====================================
  */
  wagers.forEach((item) => {
    if (item.type === "WAGER") {
    }
  });

  // ============================================
  // REMOVE EXPIRED UNACCEPTED P2P WAGERS
  // ============================================

  const EXPIRATION_BUFFER_MS = 2 * 60 * 1000;

  const filteredWagers = wagers.filter((item) => {

    if (item.type === "MARKET") return true;

    const wager = item.data as any;

    const deadline = wager.definition?.deadline;
    if (!deadline) return true;

    const deadlineMs = new Date(deadline).getTime();
    const now = Date.now();

    const isExpired = now > deadlineMs + EXPIRATION_BUFFER_MS;
    const isStillOpen = wager.status === "open";

    if (isStillOpen && isExpired) {
      return false;
    }

    return true;
  });

  /*
=====================================
LOADING SKELETON
=====================================
*/

if (!wagers || wagers.length === 0) {
  return (
    <section className="wager-section">
      <div className="wager-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="wager-skeleton" />
        ))}
      </div>
    </section>
  );
}


  return (
    <section className="wager-section">

      <div className="wager-grid">
        {filteredWagers.map((item) => {

          /*
          =============================
          MARKET TILE
          =============================
          */
          if (item.type === "MARKET") {
            return (
              <MarketTile
                key={`market-${item.data.id}`}
                market={item.data}
                onEnter={(id) => navigate(`/market/${id}`)}
              />
            );
          }

          /*
          =============================
          WAGER TILE
          =============================
          */
          return (
            <WagerTile
              key={`wager-${item.data.id}`}
              wager={item.data}
              currentUserId={currentUserId}
              onQuickBet={onQuickBet}
              onAccept={onAcceptP2P}
              onDecline={onDeclineP2P}
              onSelectWinner={onSelectWinnerP2P}
              onClaim={onClaimP2P}

              // NEW → open contract modal
              onOpenDetails={() => setSelectedWager(item.data)}
            />
          );
        })}
      </div>

      {/* NEW → ESCROW DETAILS MODAL */}
      {selectedWager && (
        <EscrowDetailModal
          wager={selectedWager}
          onClose={() => setSelectedWager(null)}
        />
      )}

    </section>
  );
}