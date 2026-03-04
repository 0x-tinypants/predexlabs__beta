import logo from "../assets/images/logo.png";

export default function Header({
  walletAddress,
  onConnect,
  firebaseUserId,
  onLogin,
  onLogout,
}: {
  walletAddress: string | null;
  onConnect: () => void;
  firebaseUserId: string | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const shorten = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="app-header">
      <div className="header-rail">

        {/* LEFT */}
        <div className="header-left">
          <button className="hamburger">☰</button>
          <span className="brand-text">Betya</span>
        </div>

        {/* CENTER */}
        <div className="header-center">
          <img src={logo} alt="Betya logo" className="header-logo" />
        </div>

        {/* RIGHT */}
        <div className="header-right">

          {/* Firebase Auth */}
          {firebaseUserId ? (
            <button className="user-status" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <button
  className="user-status"
  onClick={() => {
    onLogin();
  }}
>
  Sign In
</button>
          )}

          {/* Wallet */}
          {walletAddress ? (
            <button className="user-status">
              {shorten(walletAddress)}
            </button>
          ) : (
            <button
              className="user-status"
              onClick={onConnect}
            >
              Connect Wallet
            </button>
          )}

        </div>
      </div>
    </header>
  );
}