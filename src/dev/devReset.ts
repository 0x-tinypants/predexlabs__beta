export function devReset() {

  console.log("🧪 DEV RESET");

  const keys = [
    "predex_last_synced_block",
    "predex_wallet",
    "predex_filters",
    "predex_ui_state",
    "quickbet_intent"
  ];

  keys.forEach((k) => localStorage.removeItem(k));

  console.log("Local state cleared");

  window.location.reload();
}