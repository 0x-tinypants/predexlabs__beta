import type { Contestant } from "../../engine/market.types";

export function parseContestants(rawText: string): {
  contestants: Contestant[];
  warnings: string[];
} {
  const warnings: string[] = [];

  // Normalize whitespace
  const normalized = rawText.replace(/\s+/g, " ");

  // Match FirstName LastName (capitalized words)
  const nameRegex = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g;

  const matches = normalized.match(nameRegex) || [];

  // Remove obvious non-name phrases
  const blacklist = ["Tee Time", "Hole Players", "Round", "Demo Tee Sheet"];

  const filtered = matches.filter((name) => {
    return !blacklist.some((bad) =>
      name.toLowerCase().includes(bad.toLowerCase())
    );
  });

  // Deduplicate
  const unique = Array.from(new Set(filtered));

  if (unique.length === 0) {
    warnings.push("No valid contestant names detected.");
  }

  const contestants: Contestant[] = unique.map((name, index) => ({
    id: `contestant_${index}_${Date.now()}`,
    name: name.trim(),
  }));

  return { contestants, warnings };
}