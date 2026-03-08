import { useEffect, useState } from "react";
import logo from "../assets/images/logo.png";

export default function BootLoader() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setTimeout(() => setFade(true), 1800);
    setTimeout(() => setVisible(false), 2200);
  }, []);

  if (!visible) return null;

  return (
    <div className={`boot-loader ${fade ? "boot-fade" : ""}`}>
      <img src={logo} className="boot-logo" />
      <div className="boot-text">Loading PreDEX...</div>
    </div>
  );
}