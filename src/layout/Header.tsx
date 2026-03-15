import { useState, useEffect } from "react";
import logo from "../assets/images/logo.png";

import ProfileModal from "../components/profile/ProfileModal";

export default function Header({
  walletAddress,
  onConnect,
  onLogout,
}: {
  walletAddress: string | null;
  onConnect: () => void;
  onLogout: () => void;
}) {

  /* -------------------------------- */
  /* Helpers */
  /* -------------------------------- */

  const shorten = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  /* -------------------------------- */
  /* Profile Drawer */
  /* -------------------------------- */

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileWallet, setProfileWallet] = useState<string | null>(null);

  /* -------------------------------- */
  /* Hamburger Menu */
  /* -------------------------------- */

  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  /* -------------------------------- */
  /* Profile Event Listener */
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

  /* -------------------------------- */
  /* Menu Accordion */
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

      {/* HEADER RAIL */}

      <div className="header-rail">

        {/* LEFT SIDE */}

        <div className="header-left">
          <button
            className="hamburger"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        </div>

        {/* CENTER */}

        <div className="header-center">
          <img
            src={logo}
            alt="PreDEX logo"
            className="header-logo"
          />
        </div>

        {/* RIGHT SIDE */}

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

      {/* PROFILE MODAL */}

      <ProfileModal
        wallet={profileWallet || walletAddress}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* HAMBURGER MENU */}

      {menuOpen && (
        <>
          <div
            className="menu-overlay"
            onClick={() => setMenuOpen(false)}
          />

          <div
            className="menu-drawer"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MENU HEADER */}

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

                <p>
                  <strong>PreDEX</strong> is a peer-to-peer wagering
                  platform using smart contracts to securely hold
                  and settle bets between participants.
                </p>

                <p>
                  Funds are locked into an on-chain escrow contract
                  until the wager is resolved.
                </p>

              </div>
            )}

            <div className="menu-spacer" />

            {/* LOGOUT */}

            <button
              className="menu-logout"
              onClick={onLogout}
            >
              Logout
            </button>

          </div>
        </>
      )}

    </header>
  );
}