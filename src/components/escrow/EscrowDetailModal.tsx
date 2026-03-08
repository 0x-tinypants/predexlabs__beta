import "./escrowDetails.css";
import { ethers } from "ethers";

type EscrowDetailsModalProps = {
  wager: any;
  onClose: () => void;
};

function short(addr?: string) {
  if (!addr) return "-";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatDeadline(deadline?: string | number) {
  if (!deadline) return "-";

  const d =
    typeof deadline === "number"
      ? new Date(deadline * 1000)
      : new Date(deadline);

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EscrowDetailsModal({
  wager,
  onClose,
}: EscrowDetailsModalProps) {
  if (!wager) return null;

  console.log("MODAL WAGER:", wager);

  const def = wager.definition || {};

  const description =
    def.description ??
    wager.description ??
    "-";

  const creatorName = wager.creatorUsername ?? "-";
  const creatorWallet = wager.partyA;
  const opponentWallet = wager.partyB;

  // stake
  let stake: number | null = null;

  if (wager.stakePerParticipantWei) {
    stake = Number(ethers.formatEther(wager.stakePerParticipantWei));
  } else if (wager.exposure?.maxLoss) {
    stake = Number(wager.exposure.maxLoss);
  }

  const totalPot = stake ? stake * 2 : null;

  const deadline = formatDeadline(def.deadline);

  const etherscan =
    wager.escrowAddress
      ? `https://sepolia.etherscan.io/address/${wager.escrowAddress}`
      : null;

  return (
    <div className="escrow-modal" onClick={onClose}>
      <div
        className="escrow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="escrow-header">
          <h3>Escrow Contract</h3>
          <button className="escrow-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* DESCRIPTION */}

        {/* TYPE */}

        <div className="escrow-type">
          Peer-to-Peer Wager
        </div>

        {/* DESCRIPTION */}

        <div className="escrow-description">
          {description}
        </div>

        <div className="escrow-divider" />

        {/* PARTICIPANTS */}

        <div className="escrow-section">

          <div className="escrow-row">
            <span>Creator</span>
            <span className="escrow-identity">
              {creatorName !== creatorWallet ? creatorName : short(creatorWallet)}

              {creatorWallet && creatorName !== creatorWallet && (
                <span className="escrow-wallet">
                  {short(creatorWallet)}
                </span>
              )}
            </span>
          </div>

          <div className="escrow-row">
            <span>Opponent</span>
            <span>
              {opponentWallet ? short(opponentWallet) : "Open"}
            </span>
          </div>

        </div>

        <div className="escrow-divider" />

        {/* STAKE INFO */}

        <div className="escrow-section">

          <div className="escrow-row">
            <span>Stake Per Player</span>
            <span>
              {stake !== null ? `${stake} ETH` : "-"}
            </span>
          </div>

          <div className="escrow-row">
            <span>Total Pot</span>
            <span>
              {totalPot !== null ? `${totalPot} ETH` : "-"}
            </span>
          </div>

          <div className="escrow-row">
            <span>Deadline</span>
            <span>{deadline}</span>
          </div>

          <div className="escrow-row">
            <span>Status</span>
            <span className={`escrow-status escrow-status-${wager.status}`}>
              {wager.status}
            </span>
          </div>

        </div>

        <div className="escrow-divider" />

        {/* ESCROW CONTRACT */}

        <div className="escrow-section">

          <div className="escrow-row">
            <span>Escrow Contract</span>
            <span className="escrow-address">
              {short(wager.escrowAddress)}
            </span>
          </div>

          {etherscan && (
            <a
              href={etherscan}
              target="_blank"
              rel="noreferrer"
              className="escrow-etherscan"
            >
              View Contract on Etherscan →
            </a>
          )}

        </div>

      </div>
    </div>
  );
}