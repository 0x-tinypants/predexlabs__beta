import { CHAIN_NAMESPACES } from "@web3auth/base";

export const web3authConfig = {

  clientId: "BNbBnIObbC4CnFsKD-ImRpQ1Mq1GqbqoCZM1C11wteK8-9uBWTjJk8n_lFe3TEEfNIrmpjNWGyEPsO0kyHqVRW8",

  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7", // Sepolia
    rpcTarget: "https://rpc.sepolia.org",

    displayName: "Sepolia Testnet",
    blockExplorerUrl: "https://sepolia.etherscan.io",

    ticker: "ETH",
    tickerName: "Ethereum",
  }

};