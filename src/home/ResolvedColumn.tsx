// src/home/ResolvedColumn.tsx

import type { Wager } from "../wager";

type ResolvedColumnProps = {
  wagers: Wager[];
};

export default function ResolvedColumn({
  wagers,
}: ResolvedColumnProps) {
  return (
    <div className="resolved-column" style={{ marginTop: 48 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>
        Resolved
      </div>

      {wagers.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          No resolved wagers yet.
        </div>
      )}

      {wagers.map((wager) => (
        <div
          key={wager.id}
          style={{
            padding: 12,
            marginBottom: 8,
            borderRadius: 8,
            background: "#111",
            border: "1px solid #222",
          }}
        >
          <div style={{ fontWeight: 500 }}>
            {wager.definition.description}
          </div>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Outcome: {wager.resolution.outcome}
          </div>

          <div style={{ fontSize: 11, opacity: 0.5 }}>
            Resolved at: {wager.resolution.resolvedAt}
          </div>
        </div>
      ))}
    </div>
  );
}
