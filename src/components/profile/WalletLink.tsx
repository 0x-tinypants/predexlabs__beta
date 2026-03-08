type Props = {
  wallet?: string;
};

function shorten(addr?: string) {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletLink({ wallet }: Props) {
  if (!wallet) return <span>Unknown</span>;

  const openProfile = () => {
    window.dispatchEvent(
      new CustomEvent("openProfile", {
        detail: { wallet },
      })
    );
  };

  return (
    <span
      className="wallet-link"
      onClick={openProfile}
      title={wallet}
    >
      {shorten(wallet)}
    </span>
  );
}