import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request wallet connection
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // 🔥 Get chain directly from MetaMask
  const chainIdHex = await window.ethereum.request({
    method: "eth_chainId",
  });

  const chainId = parseInt(chainIdHex, 16);

  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("Please switch to Sepolia network");
  }

  return {
    provider,
    signer,
    address,
    chainId,
  };
}