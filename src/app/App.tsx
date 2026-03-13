import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import PageShell from "../layout/PageShell";
import Home from "../home/Home";
import MarketPage from "../market/MarketPage";

import { useWallet } from "../state/useWallet";

import Web3AuthModal from "../web3/Web3AuthModal";
import { restoreWeb3AuthSession } from "../web3/web3auth.service";

import TransactionLoader from "../ui/TransactionLoader";
import ToastSystem from "../ui/ToastSystem";
import BootLoader from "../ui/BootLoader";

export default function App() {

  /* -------------------------------- */
  /* Wallet State */
  /* -------------------------------- */

  const { wallet, connect, disconnect } = useWallet();

  /* -------------------------------- */
  /* Login Modal State */
  /* -------------------------------- */

  const [loginOpen, setLoginOpen] = useState(false);

  /* -------------------------------- */
  /* Restore Web3Auth Session On Boot */
  /* -------------------------------- */

useEffect(() => {

  const restoreSession = async () => {

    try {

      const session = await restoreWeb3AuthSession();

      if (!session) {
        console.log("No Web3Auth session found");
        return;
      }

      if (!session.provider) {
        console.log("Session restored but provider missing");
        return;
      }

      const addr = session.address.toLowerCase();

      localStorage.setItem("predex_wallet", addr);

      /* CRITICAL LINE */
      (window as any).web3authProvider = session.provider;

      console.log("Web3Auth provider restored");

    } catch (err) {

      console.warn("Web3Auth restore failed:", err);

    }

  };

  restoreSession();

}, []);

  /* -------------------------------- */
  /* Login Handlers */
  /* -------------------------------- */

  const handleMetaMaskLogin = async () => {
    await connect("metamask");
    setLoginOpen(false);
  };

  const handleWeb3AuthLogin = async () => {
    await connect("web3auth");
    setLoginOpen(false);
  };

  const handleLogout = () => {
    disconnect();
  };

  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

  return (
    <>
      <BootLoader />
      <TransactionLoader />
      <ToastSystem />

      {/* Login Modal */}

      <Web3AuthModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onMetaMask={handleMetaMaskLogin}
        onWeb3Auth={handleWeb3AuthLogin}
      />

      <Routes>

        <Route
          path="/"
          element={
            <PageShell
              walletAddress={wallet}
              onConnect={() => setLoginOpen(true)}
              onLogout={handleLogout}
            />
          }
        >

          <Route
            index
            element={
              <Home
                walletAddress={wallet}
                connect={() => setLoginOpen(true)}
              />
            }
          />

          <Route
            path="market/:marketId"
            element={
              <MarketPage currentUser={wallet} />
            }
          />

        </Route>

      </Routes>
    </>
  );
}