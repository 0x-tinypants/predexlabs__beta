import { useEffect, useState } from "react";
import { connectWallet, getSavedWallet, disconnectWallet } from "../blockchain/wallet";
import { ensureProfile, getProfile } from "../services/profile.service";

export function useWallet() {

  const [wallet, setWallet] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore saved wallet session */

  useEffect(() => {

    async function restore() {

      const saved = getSavedWallet();

      if (!saved) {
        setLoading(false);
        return;
      }

      try {

        setWallet(saved);

        await ensureProfile(saved);

        const profileData = await getProfile(saved);

        setProfile(profileData);

      } catch (err) {
        console.error("Wallet restore failed", err);
      }

      setLoading(false);
    }

    restore();

  }, []);

  /* Connect wallet */

  async function connect() {

    const result = await connectWallet();

    const walletAddress = result.address.toLowerCase();

    setWallet(walletAddress);

    await ensureProfile(walletAddress);

    const profileData = await getProfile(walletAddress);

    setProfile(profileData);
  }

  /* Disconnect */

  function disconnect() {
    disconnectWallet();
    setWallet(null);
    setProfile(null);
  }

  return {
    wallet,
    profile,
    loading,
    connect,
    disconnect,
    connected: !!wallet,
  };
}