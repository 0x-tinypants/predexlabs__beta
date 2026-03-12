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
    const session = await loginWithWeb3Auth();

    if (!session) return;

    setWalletAddress(session.address);
    setProvider(session.provider);

    return session;
  };

  const restore = async () => {
    const session = await restoreWeb3AuthSession();

    if (!session) return null;

    setWalletAddress(session.address);
    setProvider(session.provider);

    return session;
  };

  const logout = async () => {
    await logoutWeb3Auth();
    setWalletAddress(null);
    setProvider(null);
  };

  return {
    walletAddress,
    provider,
    login,
    restore,
    logout
  };
}