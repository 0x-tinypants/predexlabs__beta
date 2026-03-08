import { useEffect, useState } from "react";

type Toast = {
  id: number;
  message: string;
};

export default function ToastSystem() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {

    function showToast(message: string) {
      const id = Date.now();

      setToasts((prev) => [...prev, { id, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }

    function handleTxStart(e: any) {
      if (e?.detail?.message) {
        showToast(e.detail.message);
      }
    }

    function handleTxEnd() {
      showToast("Transaction confirmed");
    }

    window.addEventListener("predex_tx_start", handleTxStart);
    window.addEventListener("predex_tx_end", handleTxEnd);

    return () => {
      window.removeEventListener("predex_tx_start", handleTxStart);
      window.removeEventListener("predex_tx_end", handleTxEnd);
    };

  }, []);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
}