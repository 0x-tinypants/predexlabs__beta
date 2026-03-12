import { useEffect, useState } from "react";
import TileShell from "../ui/tile/TileShell";
import type { Wager } from "../wager/types";
import "./p2pTile.css";
import WalletLink from "../components/profile/WalletLink";
import { getProfile } from "../services/profile.service";

type Props = {
  wager: Wager;
  viewerAddress: string;
  onAccept?: (escrowAddress: string) => void;
  onDecline?: (escrowAddress: string) => void;
  onSelectWinner?: (escrowAddress: string, winner: string) => void;
  onClaim?: (escrowAddress: string) => void;
  onOpenDetails?: () => void;
};

export default function P2PTile({
  wager,
  viewerAddress,
  onAccept,
  onDecline,
  onSelectWinner,
  onClaim, // 👈 add this
  onOpenDetails,
}: Props) {

  const escrowAddress = wager.escrowAddress;

  const [avatarA, setAvatarA] = useState<string | null>(null);
  const [avatarB, setAvatarB] = useState<string | null>(null);
 

  /* -------------------------------------------------------
     CHAIN STATE
  ------------------------------------------------------- */
  const chainState =
    typeof wager.chainState === "number"
      ? wager.chainState
      : typeof (wager as any).status === "number"
        ? (wager as any).status
        : 0;

  const stateMap: Record<number, string> = {
    0: "CREATED",
    1: "FUNDED",
    2: "PROPOSED",
    3: "DISPUTED",
    4: "RESOLVED",
    5: "REFUNDED",
  };

  const stage = stateMap[chainState] ?? "UNKNOWN";

  /* -------------------------------------------------------
     PARTICIPANTS
  ------------------------------------------------------- */
  const partyA = wager.partyA ?? "—";
  const partyB = wager.partyB ?? "—";

  useEffect(() => {
  async function loadProfiles() {
    try {
      const a = await getProfile(partyA);
      const b = await getProfile(partyB);

      setAvatarA(a?.identity?.avatarUrl ?? null);
      setAvatarB(b?.identity?.avatarUrl ?? null);

    } catch (err) {
      console.warn("Profile load failed", err);
    }
  }

  if (partyA && partyB) {
    loadProfiles();
  }
}, [partyA, partyB]);

  const description =
    wager.definition?.description &&
      wager.definition.description !== "Peer-to-Peer Wager"
      ? wager.definition.description
      : "";

  const shortAddress = (addr?: string) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  const viewer = viewerAddress?.toLowerCase() ?? "";

  /* -------------------------------------------------------
     STAKE
  ------------------------------------------------------- */
  const stakeEth = wager.exposure?.maxLoss ?? 0;

  /* -------------------------------------------------------
     DEADLINE
  ------------------------------------------------------- */
  const deadlineTs =
    typeof wager.deadlineTs === "number"
      ? wager.deadlineTs
      : Math.floor(
        new Date(wager.definition.deadline).getTime() / 1000
      );

  const nowTs = Math.floor(Date.now() / 1000);

  const deadlineLabel = new Date(
    deadlineTs * 1000
  ).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const deadlineDateLabel = new Date(
    deadlineTs * 1000
  ).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  /* -------------------------------------------------------
   DISPUTE WINDOW (CHAIN)
------------------------------------------------------- */

  const disputeDeadline =
    typeof wager.disputeDeadline === "number"
      ? wager.disputeDeadline
      : undefined;

  const proposedWinner = wager.proposedWinner;
  const disputed = wager.disputed ?? false;


  /* -------------------------------------------------------
     CLAIMABLE LOGIC
  ------------------------------------------------------- */

  const isClaimable =
    !!escrowAddress &&
    chainState === 2 && // PROPOSED
    disputeDeadline !== undefined &&
    nowTs > disputeDeadline &&
    !disputed &&
    proposedWinner?.toLowerCase() === viewer;

  /* -------------------------------------------------------
     ACTION PERMISSIONS
  ------------------------------------------------------- */

  const canAccept =
    !!escrowAddress &&
    chainState === 0 &&
    partyB &&
    viewer === partyB.toLowerCase();

  const canDecline = canAccept;

  const canSelectWinner =
    !!escrowAddress &&
    chainState === 1 && // FUNDED
    nowTs >= deadlineTs &&
    (viewer === partyA.toLowerCase() ||
      viewer === partyB.toLowerCase());

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <TileShell
      className="p2p-tile"
      onClick={onOpenDetails}
      header={
        <div className="p2p-header">
          <div className="p2p-header-left">
            <span className="badge-p2p">P2P</span>
          </div>

          <div className={`status-pill status-${stage.toLowerCase()}`}>
            {stage}
          </div>
        </div>
      }
    >
      <div className="p2p-content">

        <div className="p2p-main">

          <div className="p2p-vs-row">
            <div className="p2p-player">
              <div className="p2p-avatar">
                {avatarA && <img src={avatarA} />}
              </div>
              <div className="p2p-username">
                <WalletLink wallet={partyA} />
              </div>
            </div>

            <div className="p2p-vs">VS</div>

            <div className="p2p-player">
              <div className="p2p-avatar">
                {avatarB && <img src={avatarB} />}
              </div>
              <div className="p2p-username">
                <WalletLink wallet={partyB} />
              </div>
            </div>
          </div>

          {/* Description preview */}
          {description && (
            <div className="p2p-description">
              {description}
            </div>
          )}

          <div className="p2p-meta">
            <span className="p2p-meta-stake">
              {stakeEth} ETH per side
            </span>

            <span className="p2p-meta-dot" />

            <span className="p2p-meta-close">
              Closes {deadlineDateLabel} · {deadlineLabel}
            </span>
          </div>

        </div>
        {(canAccept || canDecline || canSelectWinner || isClaimable) && (
          <div className="p2p-actions">

            {canAccept && (
              <button
                className="p2p-btn p2p-btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!escrowAddress) return;
                  onAccept?.(escrowAddress);
                }}
              >
                Accept Wager
              </button>
            )}

            {canDecline && (
              <button
                className="p2p-btn p2p-btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!escrowAddress) return;
                  onDecline?.(escrowAddress);
                }}
              >
                Decline
              </button>
            )}

            {canSelectWinner && (
              <>
                <button
                  className="p2p-btn p2p-btn-primary p2p-btn-select"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!escrowAddress) return;
                    onSelectWinner?.(escrowAddress, partyA);
                  }}
                >
                  <span className="p2p-btn-label">Select Winner</span>
                  <span className="p2p-btn-wallet">
                    <WalletLink wallet={partyA} />                  </span>
                </button>

                <button
                  className="p2p-btn p2p-btn-primary p2p-btn-select"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!escrowAddress) return;
                    onSelectWinner?.(escrowAddress, partyB);
                  }}
                >
                  <span className="p2p-btn-label">Select Winner</span>
                  <span className="p2p-btn-wallet">
                    <WalletLink wallet={partyB} />                  </span>
                </button>
              </>
            )}

            {isClaimable && (
              <button
                className="p2p-btn p2p-btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!escrowAddress) return;

                  // 🔒 prevent double finalize clicks
                  e.currentTarget.disabled = true;

                  onClaim?.(escrowAddress);
                }}
              >
                Claim Winnings
              </button>
            )}

          </div>
        )}
      </div>
    </TileShell>
  );
}