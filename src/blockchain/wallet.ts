import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;

const SESSION_KEY = "predex_wallet";

/* =========================================================
   CONNECT METAMASK
========================================================= */

export async function connectWallet() {

  const ethereum = (window as any).ethereum;

  if (!ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const chainIdHex = await ethereum.request({
    method: "eth_chainId",
  });

  const chainId = parseInt(chainIdHex, 16);

  if (chainId !== SEPOLIA_CHAIN_ID) {

    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });

  }

  localStorage.setItem(
    SESSION_KEY,
    address.toLowerCase()
  );

  return {
    provider,
    signer,
    address,
    chainId,
  };

}

/* =========================================================
   RESTORE SESSION
========================================================= */

export function getSavedWallet() {
  return localStorage.getItem(SESSION_KEY);
}

/* =========================================================
   DISCONNECT
========================================================= */

export function disconnectWallet() {
  localStorage.removeItem(SESSION_KEY);
}
