import "./tileShell.css";
import type { ReactNode } from "react";

type TileShellProps = {
  header?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function TileShell({
  header,
  badge,
  meta,
  children,
  onClick,
  className = "",
}: TileShellProps) {
  return (
    <div
      className={`tile-shell ${className}`}
      onClick={onClick}
      data-interactive={onClick ? "true" : "false"}
    >
      {badge && <div className="tile-badge">{badge}</div>}

      {header && <div className="tile-header">{header}</div>}

      <div className="tile-body">
        {children}
      </div>

      {meta && <div className="tile-meta">{meta}</div>}
    </div>
  );
}