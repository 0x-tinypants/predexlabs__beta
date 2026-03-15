// src/blockchain/contracts.ts

import { ethers } from "ethers";
import FactoryJSON from "./abis/PreDEXFactory.json";
import EscrowJSON from "./abis/PreDEXEscrow.json";

/* =========================================================
   CONFIG
========================================================= */

export const FACTORY_ADDRESS =
  "0x6C1458cB928660Df0ed72Ae2DD058bc156d9845E";

export const SEPOLIA_CHAIN_ID = 11155111n;


/* =========================================================
   PROVIDER RESOLUTION
========================================================= */

function resolveProviderSource() {

  const web3authProvider = (window as any).web3authProvider;
  const injectedProvider = (window as any).ethereum;

  /* Web3Auth takes priority */
  if (web3authProvider) {
    return web3authProvider;
  }

  /* MetaMask or injected wallet fallback */
  if (injectedProvider) {
    return injectedProvider;
  }

  throw new Error("No wallet provider found");
}


/* =========================================================
   PROVIDER
========================================================= */

export function getProvider() {

  const providerSource = resolveProviderSource();

  return new ethers.BrowserProvider(providerSource, "any");

}


/* =========================================================
   SIGNER
========================================================= */

export async function getSigner() {

  const provider = getProvider();

  const signer = await provider.getSigner();

  return signer;

}


/* =========================================================
   NETWORK CHECK
========================================================= */

export async function ensureSepolia() {

  try {

    const provider = getProvider();

    const network = await provider.getNetwork();

    if (network.chainId !== SEPOLIA_CHAIN_ID) {

      throw new Error(
        "Wrong network. Please switch wallet to Sepolia."
      );

    }

  } catch (err) {

    console.warn("Network check skipped:", err);

  }

}


/* =========================================================
   FACTORY CONTRACT
========================================================= */

export async function getFactory() {

  await ensureSepolia();

  const signer = await getSigner();

  return new ethers.Contract(
    FACTORY_ADDRESS,
    FactoryJSON.abi,
    signer
  );

}


/* =========================================================
   ESCROW CONTRACT
========================================================= */

export async function getEscrow(address: string) {

  await ensureSepolia();

  const signer = await getSigner();

  return new ethers.Contract(
    address,
    EscrowJSON.abi,
    signer
  );

}