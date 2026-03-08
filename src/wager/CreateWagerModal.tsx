import { useState } from "react";
import OpenBetForm from "./forms/OpenBetForm";
import CreateP2PForm from "./forms/CreateP2PForm";
import CreateMarketForm from "./forms/CreateMarketForm";
import "./CreateWagerModal.css";

type WagerStyle = "open" | "p2p" | "market";

export default function CreateWagerModal({
  category,
  onClose,
  onSubmit,
}: {
  category: string;
  onClose: () => void;
  onSubmit: (wager: any) => void;
}) {
  const [selectedStyle, setSelectedStyle] =
    useState<WagerStyle | null>(null);

  const [showComingSoon, setShowComingSoon] = useState<"open" | "market" | null>(null);

  const [demoSeed, setDemoSeed] = useState<any | null>(null);

  function loadDemoContract() {
    setSelectedStyle("open");

    setDemoSeed({
      eventName: "Turlock City NCGA",
      round: 1,
      course: "Turlock Golf & Country Club",
      tee: "Blue",
      par: 72,
      yardage: 6820,
      declaredDirection: "more",
      line: 72,
      description: "Will shoot lower than 72",
      maxLoss: 500,
      minPerParticipant: 25,
      maxPerParticipant: 200,
    });
  }

  function handleBackToSelection() {
    setSelectedStyle(null);
    setDemoSeed(null);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="create-wager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <header className="modal-header">
          <div className="header-left">
            <h2>Create Wager</h2>
          </div>

          <div className="header-right">
            <div className="user-context">
              <span className="username">@tinypants</span>
              <span className="balance">
                <span className="balance-dot" />
                $1,240.00
              </span>
            </div>

            <button
              className="demo-button"
              onClick={loadDemoContract}
            >
              Demo
            </button>
          </div>
        </header>

        {/* ================= STEP 1 ================= */}
        {selectedStyle === null && (
          <div className="modal-body">
            <div className="selection-section">
              <h4>Select Wager Type</h4>

              <div className="option-grid">
                <button
                  className="option-card"
                  onClick={() => setShowComingSoon("open")}
                >
                  Open Bet
                </button>

                <button
                  className="option-card"
                  onClick={() => setSelectedStyle("p2p")}
                >
                  Peer-to-Peer
                </button>

                <button
                  className="option-card"
                  onClick={() => setShowComingSoon("market")}
                >
                  Market
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ================= STEP 2 ================= */}
        {selectedStyle === "open" && (
          <div className="modal-body">
            <OpenBetForm
              category={category}
              onSubmit={onSubmit}
              onCancel={handleBackToSelection}
              demoSeed={demoSeed}
            />
          </div>
        )}

        {selectedStyle === "p2p" && (
          <div className="modal-body">
            <CreateP2PForm
              onSubmit={onSubmit}
              onCancel={handleBackToSelection}
            />
          </div>
        )}

        {selectedStyle === "market" && (
          <div className="modal-body">
            <CreateMarketForm
              category={category}
              onSubmit={onSubmit}
              onCancel={handleBackToSelection}
            />
          </div>
        )}

        {/* ===== COMING SOON MODAL ===== */}
        {showComingSoon && (
          <div className="coming-soon-overlay">
            <div className="coming-soon-modal">
              <h3>Coming Soon</h3>

              {showComingSoon === "open" && (
                <p>
                  Open Bets will allow you to expose a wager to the entire
                  network. Any player will be able to accept your wager.
                </p>
              )}

              {showComingSoon === "market" && (
                <p>
                  Markets will allow multiple participants to join a shared
                  betting pool with dynamic odds and payouts.
                </p>
              )}

              <button
                className="coming-soon-close"
                onClick={() => setShowComingSoon(null)}
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}