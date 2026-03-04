import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;

export async function connectWallet() {
  console.log("STEP 1: connectWallet called");

  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  console.log("STEP 2: Requesting accounts");

  await provider.send("eth_requestAccounts", []);

  console.log("STEP 3: Accounts approved");

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  console.log("STEP 4: Address:", address);

  let chainIdHex = await window.ethereum.request({
    method: "eth_chainId",
  });

  let chainId = parseInt(chainIdHex, 16);

  console.log("STEP 5: Raw chainId:", chainIdHex);
  console.log("STEP 6: Parsed chainId:", chainId);

  if (chainId !== SEPOLIA_CHAIN_ID) {
    console.log("Switching to Sepolia...");

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });

    // wait a moment for MetaMask to finish switching
    await new Promise((resolve) => setTimeout(resolve, 500));

    // re-check the network after switching
    chainIdHex = await window.ethereum.request({
      method: "eth_chainId",
    });

    chainId = parseInt(chainIdHex, 16);

    console.log("STEP 7: Updated chainId:", chainId);
  }

  console.log("STEP 8: NETWORK OK");

  console.log("STEP 8: NETWORK OK");
  return {
    provider,
    signer,
    address,
    chainId,
  };
}