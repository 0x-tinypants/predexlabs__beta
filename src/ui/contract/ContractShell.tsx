type ContractShellProps = {
  title: string;
  children: React.ReactNode;
};

export default function ContractShell({
  title,
  children,
}: ContractShellProps) {
  return (
    <div className="contract-shell">
      <div className="contract-header">
        <h3>{title}</h3>
      </div>
      <div className="contract-content">{children}</div>
    </div>
  );
}
