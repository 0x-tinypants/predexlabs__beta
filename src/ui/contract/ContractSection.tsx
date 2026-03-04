type ContractSectionProps = {
  title: string;
  children: React.ReactNode;
  dense?: boolean;          // optional tighter mode
  noBorder?: boolean;       // optional border removal
};

export default function ContractSection({
  title,
  children,
  dense = false,
  noBorder = false,
}: ContractSectionProps) {
  return (
    <section
      className={[
        "contract-section",
        dense ? "contract-section-dense" : "",
        noBorder ? "contract-section-noborder" : "",
      ].join(" ")}
    >
      <div className="contract-section-title">{title}</div>

      <div className="contract-section-body">
        {children}
      </div>
    </section>
  );
}
