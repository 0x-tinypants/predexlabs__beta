import { devReset } from "./devReset";

export default function DevResetButton() {
  return (
    <button
      onClick={devReset}
      style={{
        background: "#1a1a1a",
        border: "1px dashed #ffcc00",
        color: "#ffcc00",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        cursor: "pointer",
      }}
    >
      🧪 Dev Reset
    </button>
  );
}