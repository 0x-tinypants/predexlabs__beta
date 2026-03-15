export function runSystemAudit() {

  const audit = {
    wallet: false,
    network: false,
    chainSyncPointer: false,
    engineState: false,
    uiTiles: false
  };

  /* Wallet Check */

  const wallet = localStorage.getItem("predex_wallet");
  audit.wallet = !!wallet;

  /* Network Check */

  if (window.ethereum) {
    audit.network = true;
  }

  /* Chain Sync Pointer */

  const sync = localStorage.getItem("predex_last_synced_block");
  audit.chainSyncPointer = !!sync;

  /* Engine State */

  if ((window as any).__ENGINE_WAGERS__) {
    audit.engineState = true;
  }

  /* UI Tiles */

  const tiles = document.querySelectorAll("[data-wager-tile]");
  audit.uiTiles = tiles.length > 0;

  return audit;
}