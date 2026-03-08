import { useState, useEffect } from "react";
import logo from "../assets/images/logo.png";
import ProfileModal from "../components/profile/ProfileModal";

export default function Header({
  walletAddress,
  onConnect,
}: {
  walletAddress: string | null;
  onConnect: () => void;
}) {

  const shorten = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  /* -------------------------------- */
  /* Profile Drawer State */
  /* -------------------------------- */

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileWallet, setProfileWallet] = useState<string | null>(null);

  /* -------------------------------- */
  /* Hamburger Menu State */
  /* -------------------------------- */

  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);


  const [network, setNetwork] = useState("Loading...");
  /* -------------------------------- */
  /* Wallet Click Listener */
  /* -------------------------------- */

  useEffect(() => {
    const handler = (e: any) => {
      const wallet = e.detail?.wallet;

      if (!wallet) return;

      setProfileWallet(wallet);
      setProfileOpen(true);
    };

    window.addEventListener("openProfile", handler);

    return () => {
      window.removeEventListener("openProfile", handler);
    };
  }, []);


  useEffect(() => {
    async function detectNetwork() {
      if (!window.ethereum) {
        setNetwork("No Wallet");
        return;
      }

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId === "0xaa36a7") {
        setNetwork("Sepolia Testnet");
      } else if (chainId === "0x1") {
        setNetwork("Ethereum Mainnet");
      } else {
        setNetwork("Unknown Network");
      }
    }

    detectNetwork();
  }, []);

  /* -------------------------------- */
  /* Accordion Toggle */
  /* -------------------------------- */

  const toggleSection = (section: string) => {
    setOpenSection((prev) =>
      prev === section ? null : section
    );
  };

  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

  return (
    <header className="app-header">

      <div className="header-rail">

        {/* LEFT */}
        <div className="header-left">
          <button
            className="hamburger"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>

          <span className="brand-text">Sepolia Testnet</span>
        </div>

        {/* CENTER */}
        <div className="header-center">
          <img
            src={logo}
            alt="Betya logo"
            className="header-logo"
          />
        </div>

        {/* RIGHT */}
        <div className="header-right">

          {walletAddress ? (
            <button
              className="user-status"
              onClick={() => {
                setProfileWallet(walletAddress);
                setProfileOpen(true);
              }}
            >
              {shorten(walletAddress)}
            </button>
          ) : (
            <button
              className="user-status"
              onClick={onConnect}
            >
              Connect Wallet
            </button>
          )}

        </div>

      </div>

      {/* Profile Drawer */}

      <ProfileModal
        wallet={profileWallet || walletAddress}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* -------------------------------- */}
      {/* Hamburger Drawer */}
      {/* -------------------------------- */}

      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="menu-overlay"
            onClick={() => setMenuOpen(false)}
          />

          <div
            className="menu-drawer"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="menu-top">

              <div className="menu-header">
                Menu
              </div>

              <button
                className="menu-close"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>

            </div>
            {/* HISTORY */}
            <div
              className="menu-row"
              onClick={() => toggleSection("history")}
            >
              <span>History</span>
              <span className="menu-arrow">
                {openSection === "history" ? "▲" : "▼"}
              </span>
            </div>

            {openSection === "history" && (
              <div className="menu-panel">
                <p>No wagers yet.</p>
                <p>Your completed wagers will appear here.</p>
              </div>
            )}

            {/* HELP */}
            <div
              className="menu-row"
              onClick={() => toggleSection("help")}
            >
              <span>Help</span>
              <span className="menu-arrow">
                {openSection === "help" ? "▲" : "▼"}
              </span>
            </div>

            {openSection === "help" && (
              <div className="menu-panel">

                <div className="help-step">1. Create a wager</div>
                <div className="help-step">2. Opponent accepts</div>
                <div className="help-step">3. Select winner</div>
                <div className="help-step">4. Claim winnings</div>

              </div>
            )}

            {/* ABOUT */}
            <div
              className="menu-row"
              onClick={() => toggleSection("about")}
            >
              <span>About PreDEX</span>
              <span className="menu-arrow">
                {openSection === "about" ? "▲" : "▼"}
              </span>
            </div>

            {openSection === "about" && (
              <div className="menu-panel">

                <p><strong>PreDEX</strong> is a peer-to-peer wagering platform that uses smart contracts to securely hold and settle bets between two participants.</p>

                <p>Instead of trusting a sportsbook or middleman, funds are locked into an on-chain escrow contract until the wager is resolved.</p>

                <p><strong>How it works:</strong></p>

                <p>1. One player creates a wager.</p>
                <p>2. Another player accepts and deposits the same stake.</p>
                <p>3. Both players confirm the winner.</p>
                <p>4. The smart contract releases the funds to the winner.</p>

                <p>This system allows two parties to make and settle wagers directly, without a centralized bookmaker controlling the outcome or the funds.</p>

              </div>
            )}

            <div className="menu-spacer" />

            {/* LOGOUT */}
            <button
              className="menu-logout"
              onClick={() => window.location.reload()}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </header>
  );
}