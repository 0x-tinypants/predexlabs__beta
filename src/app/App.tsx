import { Routes, Route } from "react-router-dom";

import PageShell from "../layout/PageShell";
import Home from "../home/Home";
import MarketPage from "../market/MarketPage";
import { useWallet } from "../state/useWallet";
import TransactionLoader from "../ui/TransactionLoader";
import ToastSystem from "../ui/ToastSystem";
import BootLoader from "../ui/BootLoader";

export default function App() {

  const { wallet, connect } = useWallet();

  return (
  <>
  <BootLoader />
  <TransactionLoader />
  <ToastSystem />

  <PageShell
      walletAddress={wallet}
      onConnect={connect}
    >
      <Routes>

        <Route
          path="/"
          element={<Home currentUser={wallet} />}
        />

        <Route
          path="/market/:marketId"
          element={<MarketPage currentUser={wallet} />}
        />

      </Routes>
    </PageShell>
  </>
);
}