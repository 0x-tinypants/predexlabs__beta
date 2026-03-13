import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { web3authConfig } from "./web3auth.config";

let web3auth: Web3Auth | null = null;

async function getWeb3Auth() {
  if (!web3auth) {
    const privateKeyProvider = new EthereumPrivateKeyProvider({
      config: {
        chainConfig: web3authConfig.chainConfig,
      },
    });

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

    await web3auth.initModal();
  }

  return web3auth;
}

/* ===============================
   LOGIN
================================ */

export async function loginWithWeb3Auth() {
  const web3auth = await getWeb3Auth();

  const provider = await web3auth.connect();

  if (!provider) return null;

  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  const address = accounts?.[0]?.toLowerCase();

  if (!address) {
    console.warn("Web3Auth login returned no wallet address");
    return null;
  }

  localStorage.setItem("predex_wallet", address);

  return {
    provider,
    address,
    authProvider: web3auth.connectedAdapterName || "web3auth",
  };
}

/* ===============================
   RESTORE SESSION
================================ */
export async function restoreWeb3AuthSession() {

  const web3auth = await getWeb3Auth();

  let provider = web3auth.provider;

  /* reconnect if provider missing */
  if (!provider) {

    try {
      provider = await web3auth.connect();
    } catch (err) {
      console.log("No previous Web3Auth session");
      return null;
    }

  }

  if (!provider) return null;

  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[];

  const address = accounts?.[0]?.toLowerCase();

  if (!address) {
    console.warn("No wallet found during Web3Auth restore");
    return null;
  }

  localStorage.setItem("predex_wallet", address);

  return {
    provider,
    address,
    authProvider: web3auth.connectedAdapterName || "web3auth",
  };

}

/* ===============================
   LOGOUT
================================ */

export async function logoutWeb3Auth() {
  const web3auth = await getWeb3Auth();
  await web3auth.logout();
}