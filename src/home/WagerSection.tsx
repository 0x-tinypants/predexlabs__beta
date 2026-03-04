// src/home/WagerSection.tsx

import { useNavigate } from "react-router-dom";
import WagerTile from "./WagerTile";
import MarketTile from "./MarketTile";
import "./wagerSection.css";

import type { Wager } from "../wager/types";
import type { Market } from "../engine/market.types";

type QuickBetIntent = {
  wagerId: string;
  direction: "more" | "less" | "sideA" | "sideB";
};

export type CombinedTile = | {
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
  onClaimP2P, // 👈 add this
}: {
  title: string;
  wagers: CombinedTile[];
  currentUserId: string;

  onQuickBet: (intent: QuickBetIntent) => void;
  onAcceptP2P?: (escrowAddress: string) => void;
  onDeclineP2P?: (escrowAddress: string) => void;
  onSelectWinnerP2P?: (escrowAddress: string, winner: string) => void;
  onClaimP2P?: (escrowAddress: string) => void; // 👈 add this
}) {
  const navigate = useNavigate();

  return (
    <section className="wager-section">
      <h3 className="wager-section-title">{title}</h3>

      <div className="wager-grid">
        {wagers.map((item) => {
          // =============================
          // MARKET TILE
          // =============================
          if (item.type === "MARKET") {
            return (
              <MarketTile
                key={item.data.id}
                market={item.data}
                onEnter={(id) => navigate(`/market/${id}`)}
              />
            );
          }

          // =============================
          // WAGER TILE (UI MODEL)
          // =============================
          return (
            <WagerTile
              key={item.data.id}
              wager={item.data}
              currentUserId={currentUserId}
              onQuickBet={onQuickBet}
              onAccept={onAcceptP2P}
              onDecline={onDeclineP2P}
              onSelectWinner={onSelectWinnerP2P}
              onClaim={onClaimP2P}
            />
          );
        })}
      </div>
    </section>
  );
}