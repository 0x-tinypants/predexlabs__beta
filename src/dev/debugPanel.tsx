import { useEffect, useState } from "react";
import { runSystemAudit } from "./systemAudit";
import { getLifecycleEvents } from "./lifecycleLogger";
import "./debugPanel.css";

export default function DebugPanel() {

  const [wallet, setWallet] = useState<string | null>(null);
  const [lastBlock, setLastBlock] = useState<string | null>(null);
  const [audit, setAudit] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);

  /* -------------------------------- */
  /* Poll Debug Data */
  /* -------------------------------- */

  useEffect(() => {

    const interval = setInterval(() => {

      const walletLS = localStorage.getItem("predex_wallet");
      const syncBlock = localStorage.getItem("predex_last_synced_block");

      setWallet(walletLS);
      setLastBlock(syncBlock);

      const auditResults = runSystemAudit();
      setAudit(auditResults);

      const lifecycle = getLifecycleEvents();
      setEvents(lifecycle);

    }, 1000);

    return () => clearInterval(interval);

  }, []);

  /* -------------------------------- */
  /* Status Helper */
  /* -------------------------------- */

  const status = (value: boolean) => {
    return value ? "✓ PASS" : "✗ FAIL";
  };

  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

  return (
    <div className="predex-debug-panel">

      {/* HEADER */}

      <div className="predex-debug-title">
        🧠 PreDEX Debug
      </div>

      {/* SYSTEM SECTION */}

      <div className="predex-debug-section">

        <div className="predex-debug-section-title">
          System
        </div>

        <div className="predex-debug-text">
          Wallet: {wallet || "Not Connected"}
        </div>

        <div className="predex-debug-text">
          Last Sync Block: {lastBlock || "Not Synced"}
        </div>

      </div>

      <div className="predex-debug-divider" />

      {/* AUDIT SECTION */}

      <div className="predex-debug-section">

        <div className="predex-debug-section-title">
          System Audit
        </div>

        <div className="predex-debug-text">
          Wallet State: {status(audit.wallet)}
        </div>

        <div className="predex-debug-text">
          Network Provider: {status(audit.network)}
        </div>

        <div className="predex-debug-text">
          ChainSync Pointer: {status(audit.chainSyncPointer)}
        </div>

        <div className="predex-debug-text">
          Engine State: {status(audit.engineState)}
        </div>

        <div className="predex-debug-text">
          UI Tiles Rendered: {status(audit.uiTiles)}
        </div>

      </div>

      <div className="predex-debug-divider" />

      {/* LIFECYCLE EVENTS */}

      <div className="predex-debug-section">

        <div className="predex-debug-section-title">
          Lifecycle Events
        </div>

        <div className="predex-debug-events">

          {events.length === 0 && (
            <div className="predex-status-neutral">
              No events yet
            </div>
          )}

          {events.slice().reverse().map((e, i) => (
            <div key={i}>
              {e.event}
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}