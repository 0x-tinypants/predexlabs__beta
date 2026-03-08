import { useEffect, useState } from "react";

export default function TransactionLoader() {

  const [visible, setVisible] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(
    "Confirm transaction in your wallet..."
  );

  useEffect(() => {

    function start(e: any) {
      if (e?.detail?.message) {
        setLoaderMessage(e.detail.message);
      }
      setVisible(true);
    }

    function end() {
      setLoaderMessage("Transaction confirmed ✓");

      setTimeout(() => {
        setVisible(false);
      }, 900);
    }

    window.addEventListener("predex_tx_start", start as EventListener);
    window.addEventListener("predex_tx_end", end);

    return () => {
      window.removeEventListener("predex_tx_start", start as EventListener);
      window.removeEventListener("predex_tx_end", end);
    };

  }, []);

  if (!visible) return null;

  return (
    <div className="tx-loader-overlay">
      <div className="tx-loader-card">

        <div className="tx-loader-spinner" />

        <div className="tx-loader-title">
          Submitting Transaction
        </div>

        <div className="tx-loader-message">
          {loaderMessage}
        </div>

      </div>
    </div>
  );
}