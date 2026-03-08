import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;

const SESSION_KEY = "predex_wallet";

/* =========================================================
   CONNECT WALLET
========================================================= */

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const chainIdHex = await window.ethereum.request({
    method: "eth_chainId",
  });

  const chainId = parseInt(chainIdHex, 16);

  if (chainId !== SEPOLIA_CHAIN_ID) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
  }

  /* Save wallet session */
  localStorage.setItem(SESSION_KEY, address.toLowerCase());

  return {
    provider,
    signer,
    address,
    chainId,
  };
}

/* =========================================================
   RESTORE WALLET SESSION
========================================================= */

export function getSavedWallet() {
  return localStorage.getItem(SESSION_KEY);
}

/* =========================================================
   CLEAR WALLET SESSION
========================================================= */

export function disconnectWallet() {
  localStorage.removeItem(SESSION_KEY);
}