import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { web3authConfig } from "./web3auth.config";

let web3auth: Web3Auth | null = null;

export async function initWeb3Auth() {
  if (web3auth) return web3auth;

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: {
      chainConfig: web3authConfig.chainConfig,
    },
  }) as any;

  web3auth = new Web3Auth({
    clientId: web3authConfig.clientId,
    web3AuthNetwork: "sapphire_devnet",
    privateKeyProvider,
    uiConfig: {
      appName: "PreDEX",
      mode: "light",
      loginMethodsOrder: ["google", "email_passwordless", "metamask"],
    },
  });

  await web3auth.init();

  return web3auth;
}

export async function loginWithWeb3Auth() {
  const instance = await initWeb3Auth();

  const provider = await instance.connect();

  if (!provider) {
    throw new Error("Web3Auth login failed");
  }

  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No wallet returned from Web3Auth");
  }

  return {
    address: accounts[0].toLowerCase(),
    provider,
  };
}

export async function restoreWeb3AuthSession() {
  const instance = await initWeb3Auth();

  if (!instance.provider) return null;

  const provider = instance.provider;

  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  if (!accounts || accounts.length === 0) return null;

  return {
    address: accounts[0].toLowerCase(),
    provider,
  };
}

export async function logoutWeb3Auth() {
  if (!web3auth) return;
  await web3auth.logout();
}