import { useEffect, useState } from "react";
import { getSavedWallet } from "../../blockchain/wallet";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Profile } from "../../types/profile.types";
import { updateProfileIdentity } from "../../services/profile.service";
import { useRef } from "react";
import "./profile.css";
import WalletLink from "./WalletLink";

type Props = {
  wallet: string;
};

type HistoryItem = {
  id: string;
  result: "WIN" | "LOSS";
  opponent?: string;
  stake: number;
  timestamp: number;
};

export default function ProfileViewer({ wallet }: Props) {
  const viewerWallet = getSavedWallet();

  const isOwner =
    viewerWallet &&
    viewerWallet.toLowerCase() === wallet.toLowerCase();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      img.src = reader.result;
    };

    img.onload = async () => {
      const canvas = document.createElement("canvas");

      const MAX = 128; // avatar size
      canvas.width = MAX;
      canvas.height = MAX;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, MAX, MAX);

      const avatarUrl = canvas.toDataURL("image/jpeg", 0.7);

      await updateProfileIdentity(wallet, {
        avatarUrl,
      });

      setProfile((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          identity: {
            ...prev.identity,
            avatarUrl,
          },
        };
      });

      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };
  /* -------------------------------- */
  /* Helpers */
  /* -------------------------------- */

  const shorten = (addr?: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      alert("Wallet copied to clipboard");
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  /* -------------------------------- */
  /* Load Profile + History */
  /* -------------------------------- */

  useEffect(() => {
    async function loadProfile() {
      try {
        const walletKey = wallet.toLowerCase();

        /* Profile */
        const profileRef = doc(db, "profiles", walletKey);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data() as Profile;
          setProfile(data);
          setUsernameInput(data.identity.username || "");
        }

        /* History */
        const historyRef = collection(
          db,
          "profiles",
          walletKey,
          "history"
        );

        const historySnap = await getDocs(historyRef);

        const wagers: HistoryItem[] = historySnap.docs.map((d) => ({
          ...(d.data() as Omit<HistoryItem, "id">),
          id: d.id,
        }));

        wagers.sort((a, b) => b.timestamp - a.timestamp);

        setHistory(wagers.slice(0, 5));
      } catch (err) {
        console.error("Profile load failed", err);
      }
    }

    loadProfile();
  }, [wallet]);

  /* -------------------------------- */
  /* Loading */
  /* -------------------------------- */

  if (!profile) {
    return <div className="profile-viewer">Loading...</div>;
  }

  const total = profile.stats.totalWagers;

  const winRate =
    total > 0
      ? Math.round((profile.stats.wins / total) * 100)
      : 0;


  /* -------------------------------- */
  /* Join Date */
  /* -------------------------------- */

  let joinDate = "";

  if (profile.meta?.createdAt) {
    const date = new Date(profile.meta.createdAt);
    joinDate = date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }

  /* -------------------------------- */
  /* Reputation Badges */
  /* -------------------------------- */

  const badges: string[] = [];

  badges.push("🚀 Early User");

  if (profile.stats.totalWagers >= 10) {
    badges.push("🎯 10+ Wagers");
  }

  if (profile.stats.totalVolumeEth >= 1) {
    badges.push("📈 High Volume");
  }

  if (winRate >= 60 && total >= 5) {
    badges.push("🔥 Hot Streak");
  }
  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

  return (
    <div className="profile-viewer">

      {/* ============================= */}
      {/* Identity Header */}
      {/* ============================= */}

      <div className="profile-identity-card">
        <div className="profile-header">

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />

          <img
            src={
              profile.identity.avatarUrl ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`
            }
            className="profile-avatar"
            onClick={() => {
              if (isOwner) fileInputRef.current?.click();
            }}
            style={{
              cursor: isOwner ? "pointer" : "default",
              border: isOwner ? "2px solid #58dd53" : undefined
            }}
          />

          <div className="profile-identity">
            {/* Username */}

            <div className="profile-username">

              {!editingUsername && (
                <span
                  onClick={() => {
                    if (isOwner) {
                      setEditingUsername(true);
                    }
                  }}
                  style={{
                    cursor: isOwner ? "pointer" : "default"
                  }}
                >
                  {profile.identity.username || shorten(wallet)}
                </span>
              )}

              {editingUsername && (
                <input
                  value={usernameInput}
                  autoFocus
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onBlur={async () => {
                    const newName =
                      usernameInput.trim() || null;

                    await updateProfileIdentity(wallet, {
                      username: newName,
                    });

                    setProfile({
                      ...profile,
                      identity: {
                        ...profile.identity,
                        username: newName,
                      },
                    });

                    setEditingUsername(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              )}

            </div>

            {/* Wallet */}

            <div className="profile-wallet">

              {shorten(wallet)}

              <button
                className="wallet-copy"
                onClick={copyWallet}
                title="Copy wallet"
              >
                📋
              </button>

            </div>


            {/* Reputation Badges */}

            <div className="profile-badges-scroll">

              <div className="profile-badges-track">
                {badges.map((b, i) => (
                  <span key={i} className="profile-badge">
                    {b}
                  </span>
                ))}
              </div>

            </div>

            {/* Metadata Line */}

            <div className="profile-trust">
              {joinDate && `Joined ${joinDate} • `}
              {profile.stats.totalWagers} wagers •
              {profile.stats.totalVolumeEth} ETH volume
            </div>

          </div>   {/* closes profile-identity */}
        </div>   {/* closes profile-header */}
      </div>   {/* closes profile-identity-card */}

      <div className="profile-divider" />

      {/* ============================= */}
      {/* Golf Profile */}
      {/* ============================= */}

      <div className="profile-section-title">
        •• Golf Profile
      </div>

      <div className="golf-card">

        <div className="golf-row">
          <div className="golf-label">GHIN Index</div>
          <div className="golf-value">
            {profile.golf?.handicapIndex ?? "—"}
          </div>
        </div>

        <div className="golf-row">
          <div className="golf-label">GHIN ID</div>
          <div className="golf-value">
            {profile.golf?.ghinId ?? "Not linked"}
          </div>
        </div>

        <div className="golf-row">
          <div className="golf-label">Verification</div>

          {profile.golf?.verified ? (
            <div className="golf-verified">
              ✓ Verified
            </div>
          ) : (
            <div className="golf-unverified">
              Not Verified
            </div>
          )}
        </div>

        <button className="profile-edit-btn">
          Link GHIN
        </button>

      </div>

      {/* ============================= */}
      {/* Reputation */}
      {/* ============================= */}

      <div className="profile-section-title">
        •• Reputation
      </div>

      {/* ============================= */}
      {/* Reputation Stats */}
      {/* ============================= */}

      <div className="profile-stats">

        <div className="profile-stat">
          <div className="stat-label">Wins</div>
          <div className="stat-value win">
            {profile.stats.wins}
          </div>
        </div>

        <div className="profile-stat">
          <div className="stat-label">Losses</div>
          <div className="stat-value loss">
            {profile.stats.losses}
          </div>
        </div>

        <div className="profile-stat">
          <div className="stat-label">Volume</div>
          <div className="stat-value">
            {profile.stats.totalVolumeEth} ETH
          </div>
        </div>

        <div className="profile-stat">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value win">
            {winRate}%
          </div>
        </div>

      </div>
      {/* ============================= */}
      {/* Recent Wagers */}
      {/* ============================= */}

      <div className="profile-history">

        <div className="profile-section-title">
          •• Activity
        </div>

        {history.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 13 }}>
            No wagers yet
          </div>
        )}

        {history.map((h) => (

          <div
            className="history-row"
            key={h.id}
          >

            <div
              className={`history-result ${h.result === "WIN"
                ? "win"
                : "loss"
                }`}
            >
              {h.result}
            </div>

            <div className="history-opponent">
              vs <WalletLink wallet={h.opponent || wallet} />
            </div>

            <div className="history-stake">
              {h.stake} ETH
            </div>

            <div className="history-time">
              {h.timestamp
                ? new Date(h.timestamp)
                  .toLocaleDateString()
                : "-"}
            </div>

          </div>

        ))}

      </div>

    </div >
  );
}
