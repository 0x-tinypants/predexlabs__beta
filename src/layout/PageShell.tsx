import { useState, ReactNode } from "react";
import Header from "./Header";
import { connectWallet } from "../blockchain/wallet";

type PageShellProps = {
  children: ReactNode;
  firebaseUserId: string | null;
  onLogin: () => void;
  onLogout: () => void;
  fullWidth?: boolean;
};

export default function PageShell({
  children,
  firebaseUserId,
  onLogin,
  onLogout,
  fullWidth = false,
}: PageShellProps) {
  const [walletAddress, setWalletAddress] =
    useState<string | null>(null);

  const handleConnect = async () => {
  console.log("CLICK: Connect Wallet button");

  try {
    const wallet = await connectWallet();

    console.log("SUCCESS: wallet returned", wallet);

    setWalletAddress(wallet.address);
  } catch (err: any) {
    console.error("ERROR CONNECTING WALLET:", err);
    alert(err.message);
  }
};

  return (
    <div className="app-shell">
      <Header
        walletAddress={walletAddress}
        onConnect={handleConnect}
        firebaseUserId={firebaseUserId}
        onLogin={onLogin}
        onLogout={onLogout}
      />

      <main className="app-content">
        <div
          className={`content-rail ${
            fullWidth ? "content-rail--full" : ""
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}