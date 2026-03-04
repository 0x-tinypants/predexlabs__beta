import TileShell from "../ui/tile/TileShell";
import "./marketTile.css";

import type { Market } from "../engine/market.types";

export default function MarketTile({
  market,
  onEnter,
}: {
  market: Market;
  onEnter: (id: string) => void;
}) {
  return (
    <TileShell
      className="market-tile"
      onClick={() => onEnter(market.id)}
      badge={
        <span className="badge-market">
          MARKET
        </span>
      }
      meta={
        <div className="market-footer">
          {market.status.toUpperCase()}
        </div>
      }
    >
      <div className="market-body">
        <h3 className="market-title">
          {market.courseContext.courseName}
        </h3>

        <div className="market-sub">
          {market.format} • {market.courseContext.teeName} Tee
        </div>

        <div className="market-meta">
          Par {market.courseContext.par} •{" "}
          {market.courseContext.yardage} yds
        </div>
      </div>
    </TileShell>
  );
}