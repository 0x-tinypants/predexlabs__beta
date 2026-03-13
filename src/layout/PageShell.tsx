import { Outlet } from "react-router-dom";
import Header from "./Header";

type Props = {
  walletAddress: string | null;
  onConnect: () => void;
  onLogout: () => void;
};

export default function PageShell({
  walletAddress,
  onConnect,
  onLogout,
}: Props) {
  return (
    <div className="app-shell">

      {/* Header */}
      <Header
        walletAddress={walletAddress}
        onConnect={onConnect}
        onLogout={onLogout}
      />

      {/* Main Page Content */}
      <main className="app-main">
        <Outlet />
      </main>

    </div>
  );
}