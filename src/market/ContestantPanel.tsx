import { useState } from "react";
import type { Market } from "../engine/market.types";
import { extractTextFromPdf } from "./pdf/extractTextFromPdf";
import { parseContestants } from "./contestants/parseContestants";

type Props = {
  market: Market;
  onUpdate: (updated: Market) => void;
};

export default function ContestantPanel({
  market,
  onUpdate,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const { text } = await extractTextFromPdf(file);
      const { contestants, warnings } = parseContestants(text);

      const updated: Market = {
        ...market,
        contestants,
        contestantUpload: {
          status: "ready",
          uploadedAt: new Date().toISOString(),
          sourceName: file.name,
          parsedCount: contestants.length,
          error: warnings.join(", ") || undefined,
        },
      };

      onUpdate(updated);
    } catch (e) {
      console.error(e);
      setError("Failed to parse PDF.");
    }

    setParsing(false);
  }

  return (
  <section className="market-sidebar">
    <div className="contestant-header">
      <h3 style={{ marginTop: 0 }}>Contestants</h3>

      <div style={{ marginTop: 12 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
        />

        <button
          onClick={handleParse}
          disabled={!file || parsing}
          style={{ marginLeft: 10 }}
        >
          {parsing ? "Parsing..." : "Parse"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "red" }}>
          {error}
        </div>
      )}

      {market.contestantUpload?.parsedCount ? (
        <div style={{ opacity: 0.6, marginTop: 8 }}>
          Parsed {market.contestantUpload.parsedCount} contestants
        </div>
      ) : null}
    </div>

    {market.contestants?.length ? (
      <div className="contestant-scroll">
        {market.contestants.map((c) => (
          <div key={c.id} className="contestant-row">
            {c.name}
          </div>
        ))}
      </div>
    ) : (
      <div
        style={{
          marginTop: 14,
          opacity: 0.5,
        }}
      >
        No contestants uploaded.
      </div>
    )}
  </section>
);
}
