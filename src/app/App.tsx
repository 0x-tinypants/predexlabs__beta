import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import PageShell from "../layout/PageShell";
import Home from "../home/Home";
import MarketPage from "../market/MarketPage";

import { useWallet } from "../state/useWallet";

import Web3AuthModal from "../web3/Web3AuthModal";

import TransactionLoader from "../ui/TransactionLoader";
import ToastSystem from "../ui/ToastSystem";
import BootLoader from "../ui/BootLoader";

export default function App() {
  const { wallet, connect } = useWallet();

  const [loginOpen, setLoginOpen] = useState(false);

  /* ------------------------------ */
  /* Login Handlers */
  /* ------------------------------ */

  const handleMetaMaskLogin = async () => {
    await connect("metamask");
    setLoginOpen(false);
  };

  const handleWeb3AuthLogin = async () => {
    await connect("web3auth");
    setLoginOpen(false);
  };

  /* ------------------------------ */
  /* Render */
  /* ------------------------------ */

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
            element={<MarketPage currentUser={wallet} />}
          />

        </Route>

      </Routes>
    </>
  );
}