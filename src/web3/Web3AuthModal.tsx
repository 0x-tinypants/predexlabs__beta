import React from "react";
import "./web3auth.css";

export default function Web3AuthModal({
  isOpen,
  onClose,
  onMetaMask,
  onWeb3Auth
}: {
  isOpen: boolean;
  onClose: () => void;
  onMetaMask: () => void;
  onWeb3Auth: () => void;
}) {

  if (!isOpen) return null;

  return (
    <div className="login-overlay">

      <div className="login-modal">

        <div className="login-header">
          Login to PreDEX
        </div>

        <div className="login-body">

          <button
            className="login-btn metamask"
            onClick={onMetaMask}
          >
            Connect MetaMask
          </button>

          <button
            className="login-btn web3auth"
            onClick={onWeb3Auth}
          >
            Continue with Google / Email
          </button>

        </div>

        <div className="login-footer">

          <button
            className="login-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  );
}