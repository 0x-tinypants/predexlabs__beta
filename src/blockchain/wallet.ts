import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  const chainId = Number(network.chainId);

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