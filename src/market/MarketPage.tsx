// src/market/MarketPage.tsx

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Market } from "../engine/market.types";
import ContestantPanel from "./ContestantPanel";
import { generateContractsForMarket } from "../engine/market.contracts";
import "./market.css";

export default function MarketPage({
  currentUser,
}: {
  currentUser: string | null;
}) {
  const { marketId } = useParams();
  const navigate = useNavigate();

  /* =========================
     LOAD MARKETS (LocalStorage)
  ========================= */
  const [markets, setMarkets] = useState<Market[]>(() => {
    const stored = localStorage.getItem("predex_engine_markets");
    return stored ? JSON.parse(stored) : [];
  });

  const market = markets.find((m) => m.id === marketId);

  /* =========================
     UPDATE MARKET HELPER
  ========================= */
  function updateMarket(updated: Market) {
    const next = markets.map((m) =>
      m.id === updated.id ? updated : m
    );

    setMarkets(next);

    localStorage.setItem(
      "predex_engine_markets",
      JSON.stringify(next)
    );
  }

  function handleGenerateContracts() {
    if (!market) return;
    if (!market.courseContext) {
      alert("Course context missing.");
      return;
    }

    if (!market.contestants || market.contestants.length === 0) {
      alert("No contestants found.");
      return;
    }

    try {
      const participants = market.contestants.map((contestant) => ({
        id: contestant.id ?? contestant.name,
        name: contestant.name,
        handicapIndex: 0, // temporary neutral handicap
      }));

      const contracts = generateContractsForMarket({
        marketId: market.id,
        participants,
        courseContext: market.courseContext,
      });

      updateMarket({
        ...market,
        contracts,
      });

    } catch (err) {
      alert((err as Error).message);
    }
  }


  /* =========================
     NOT FOUND STATE
  ========================= */
  if (!market) {
    return (
      <div className="content-rail content-rail--full">
        <div style={{ padding: 32 }}>
          <h2>Market Not Found</h2>
          <button onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const {
    courseContext,
    format,
    status,
    creatorUsername,
    createdAt,
  } = market;

  return (
    <div className="market-page">

      {/* Back Button */}
      <div className="market-back">
        <button onClick={() => navigate("/")}>
          ← Back
        </button>
      </div>

      {/* Header */}


      {/* Top Grid */}
      <div className="market-top">

        {/* LEFT: Market Info */}
        <section className="market-card">

          <div className="market-label">MARKET</div>

          <h1 className="market-title">
            {courseContext.courseName}
          </h1>

          <div className="market-sub">
            {format} • {courseContext.teeName} Tee
          </div>

          <div className="market-meta">
            <span>Status: {status.toUpperCase()}</span>
            <span>Creator: {creatorUsername}</span>
            <span>
              Created: {new Date(createdAt).toLocaleString()}
            </span>
          </div>

          <div className="divider" />

          <div className="card-label">PARAMETERS</div>

          <div className="param-grid">
            <div>
              <span>Par</span>
              <strong>{courseContext.par}</strong>
            </div>

            <div>
              <span>Yardage</span>
              <strong>{courseContext.yardage}</strong>
            </div>

            <div>
              <span>Tee</span>
              <strong>{courseContext.teeName}</strong>
            </div>
          </div>

        </section>

        {/* RIGHT: Contestants */}
        <section className="market-sidebar">
          <ContestantPanel
            market={market}
            onUpdate={updateMarket}
          />
        </section>

      </div>

      {/* Contracts Grid */}
      <section className="contracts-section">
        <div className="contracts-header">
          <h3>Market Contracts</h3>

          <button
            className="generate-btn"
            onClick={handleGenerateContracts}
          >
            Generate Contracts
          </button>
        </div>

        {market.contracts && market.contracts.length > 0 ? (
          <div className="contracts-grid">
            {market.contracts.map((contract) => (
              <div key={contract.id} className="contract-card">
                <div className="contract-name">
                  {contract.participantName}
                </div>

                <div className="contract-line">
                  Line: {contract.line}
                </div>

                <div className="contract-actions">
                  <button>MORE</button>
                  <button>LESS</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="contracts-empty">
            No contracts created yet.
          </div>
        )}
      </section>
    </div>
  );
}
