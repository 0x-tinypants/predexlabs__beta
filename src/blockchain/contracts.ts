// src/blockchain/contracts.ts

import { ethers } from "ethers";
import FactoryJSON from "./abis/PreDEXFactory.json";
import EscrowJSON from "./abis/PreDEXEscrow.json";

/* =========================
   CONFIG
========================= */

export const FACTORY_ADDRESS =
  "0x6C1458cB928660Df0ed72Ae2DD058bc156d9845E"; // Sepolia deployed factory

/* =========================
   PROVIDER + SIGNER
========================= */

export function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
}

export async function ensureSepolia() {
  if (!window.ethereum || !window.ethereum.selectedAddress) {
    // wallet not connected yet — skip check
    return;
  }

  const provider = getProvider();
  const network = await provider.getNetwork();

  if (network.chainId !== 11155111n) {
    throw new Error("Please switch to Sepolia network");
  }
}

/* =========================
   CONTRACT GETTERS
========================= */

export async function getFactory() {
  await ensureSepolia();

  const signer = await getSigner();

  return new ethers.Contract(
    FACTORY_ADDRESS,
    FactoryJSON.abi,
    signer
  );
}

export async function getEscrow(address: string) {
  await ensureSepolia();

  const signer = await getSigner();

  return new ethers.Contract(
    address,
    EscrowJSON.abi,
    signer
  );
}