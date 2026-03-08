import { useState, useEffect, ReactNode } from "react";
import Header from "./Header";
import { connectWallet, getSavedWallet } from "../blockchain/wallet";
import { ensureProfile } from "../services/profile.service";

type PageShellProps = {
  children: ReactNode;
  walletAddress: string | null;
  onConnect: () => void;
  fullWidth?: boolean;
};

export default function PageShell({
  children,
  walletAddress: externalWallet,
  onConnect: externalConnect,
  fullWidth = false,
}: PageShellProps) {

  const [walletAddress, setWalletAddress] =
    useState<string | null>(externalWallet ?? null);

  useEffect(() => {
    const restore = async () => {

      const savedWallet = getSavedWallet();

      if (!savedWallet) return;

      console.log("SESSION RESTORED:", savedWallet);

      setWalletAddress(savedWallet);

      await ensureProfile(savedWallet);

    };

    restore();

  }, []);

  const handleConnect = async () => {

    console.log("CLICK: Connect Wallet");

    try {

      const wallet = await connectWallet();

      const address = wallet.address.toLowerCase();

      setWalletAddress(address);

      await ensureProfile(address);

      if (externalConnect) {
        await externalConnect();
      }

    } catch (err: any) {

      console.error("WALLET CONNECT FAILED:", err);

      alert(err.message);

    }

  };

  return (
    <div className="app-shell">

      <Header
        walletAddress={walletAddress}
        onConnect={handleConnect}
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