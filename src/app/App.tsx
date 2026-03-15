import { Routes, Route } from "react-router-dom";
import { useState } from "react";

/* Layout */
import PageShell from "../layout/PageShell";

/* Pages */
import Home from "../home/Home";
import MarketPage from "../market/MarketPage";

/* Wallet */
import { useWallet } from "../state/useWallet";

/* Web3 */
import Web3AuthModal from "../web3/Web3AuthModal";

/* UI Systems */
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
      {/* Core UI Systems */}

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

      {/* App Routes */}

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

          {/* Home */}

          <Route
            index
            element={
              <Home
                walletAddress={wallet}
                connect={() => setLoginOpen(true)}
              />
            }
          />

          {/* Market */}

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