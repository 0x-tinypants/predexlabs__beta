import { useEffect, useState } from "react";
import {
  connectWallet,
  getSavedWallet,
  disconnectWallet
} from "../blockchain/wallet";

import {
  ensureProfile,
  getProfile
} from "../services/profile.service";

import {
  loginWithWeb3Auth,
  restoreWeb3AuthSession
} from "../web3/web3auth.service";

import { logoutWeb3Auth } from "../web3/web3auth.service";

export function useWallet() {

  const [wallet, setWallet] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------- */
  /* Restore wallet session */
  /* -------------------------------- */

  useEffect(() => {

    async function restore() {

      try {

        /* stop restore if user logged out */

        if (localStorage.getItem("predex_force_logout") === "true") {
          setLoading(false);
          return;
        }

        /* 1️⃣ Try Web3Auth session */

        const web3Session = await restoreWeb3AuthSession();

        if (web3Session?.address) {

          /* restore provider */
          (window as any).web3authProvider = web3Session.provider;

          const walletAddress = web3Session.address.toLowerCase();

          setWallet(walletAddress);

          await ensureProfile(walletAddress);

          const profileData = await getProfile(walletAddress);

          setProfile(profileData);

          setLoading(false);
          return;
        }
        /* 2️⃣ Fallback to MetaMask */

        const saved = getSavedWallet();

        if (!saved) {
          setLoading(false);
          return;
        }

        const walletAddress = saved.toLowerCase();

        setWallet(walletAddress);

        await ensureProfile(walletAddress);

        const profileData = await getProfile(walletAddress);

        setProfile(profileData);

      } catch (err) {
        console.error("Wallet restore failed:", err);
      }

      setLoading(false);
    }

    restore();

  }, []);

  /* -------------------------------- */
  /* Connect wallet */
  /* -------------------------------- */

  async function connect(providerType: "metamask" | "web3auth" = "metamask") {

    localStorage.removeItem("predex_force_logout");

    setLoading(true);

    try {

      let walletAddress: string;

      if (providerType === "metamask") {

        const result = await connectWallet();
        walletAddress = result.address.toLowerCase();

      } else {

        const result = await loginWithWeb3Auth();

        if (!result?.address) {
          setLoading(false);
          return;
        }

        /* expose provider globally for contracts */
        (window as any).web3authProvider = result.provider;

        walletAddress = result.address.toLowerCase();

      }

      setWallet(walletAddress);

      await ensureProfile(walletAddress);

      const profileData = await getProfile(walletAddress);

      setProfile(profileData);

    } catch (err) {
      console.error("Wallet connection failed:", err);
    }

    setLoading(false);
  }

  /* -------------------------------- */
  /* Disconnect */
  /* -------------------------------- */

  async function disconnect() {

    localStorage.setItem("predex_force_logout", "true");

    disconnectWallet();

    await logoutWeb3Auth();

    setWallet(null);
    setProfile(null);
  }

  return {
    wallet,
    profile,
    loading,
    connect,
    disconnect,
    connected: !!wallet
  };
}