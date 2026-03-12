import { Outlet } from "react-router-dom";
import Header from "./Header";

type Props = {
  walletAddress: string | null;
  onConnect: () => void;
};

export default function PageShell({ walletAddress, onConnect }: Props) {
  return (
    <div className="app-shell">

      <Header
        walletAddress={walletAddress}
        onConnect={onConnect}
      />

      <main className="app-main">
        <Outlet />
      </main>

    </div>
  );
}