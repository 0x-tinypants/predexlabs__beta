import { useState } from "react";
import {
  loginWithWeb3Auth,
  restoreWeb3AuthSession,
  logoutWeb3Auth
} from "./web3auth.service";

export function useWeb3Auth() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);

  const login = async () => {

    /* clear logout override */
    localStorage.removeItem("predex_force_logout");

    const session = await loginWithWeb3Auth();

    if (!session) return;

    const addr = session.address.toLowerCase();

    localStorage.setItem("predex_wallet", addr);

    (window as any).web3authProvider = session.provider;

    setWalletAddress(addr);

    (window as any).web3authProvider = session.provider;

    setProvider(session.provider);

    return session;
  };

  const restore = async () => {

    const forcedLogout = localStorage.getItem("predex_force_logout");

    if (forcedLogout === "true") {
      return null;
    }

    const session = await restoreWeb3AuthSession();
    if (!session) return null;

    const addr = session.address.toLowerCase();

    localStorage.setItem("predex_wallet", addr);

    (window as any).web3authProvider = session.provider;

    setWalletAddress(addr);

    (window as any).web3authProvider = session.provider;

    setProvider(session.provider);

    return session;
  };

  const logout = async () => {

    localStorage.setItem("predex_force_logout", "true");

    localStorage.removeItem("predex_wallet");

    await logoutWeb3Auth();

    setWalletAddress(null);
    setProvider(null);

    window.location.reload();
  };

  return {
    walletAddress,
    provider,
    login,
    restore,
    logout
  };
}