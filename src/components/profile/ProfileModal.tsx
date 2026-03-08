import { useEffect } from "react";
import "./profile.css";
import ProfileViewer from "./ProfileViewer";

type ProfileModalProps = {
  wallet: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfileModal({
  wallet,
  isOpen,
  onClose,
}: ProfileModalProps) {

  /* =========================================
     Close on ESC
  ========================================= */

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);


  /* =========================================
     Prevent page scroll while drawer is open
  ========================================= */

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);


  /* =========================================
     Guard
  ========================================= */

  if (!isOpen || !wallet) return null;


  /* =========================================
     Render
  ========================================= */

  return (
  <div
    className="profile-drawer-overlay"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}
  >
    <div
      className="profile-drawer"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="profile-drawer-close"
        onClick={onClose}
      >
        ✕
      </button>

      <div className="profile-drawer-body">
        <ProfileViewer wallet={wallet} />
      </div>
    </div>
  </div>
);
}