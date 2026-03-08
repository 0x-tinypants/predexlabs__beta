import { doc, setDoc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function recordResolvedWager(params: {
  escrowAddress: string;
  winner: string;
  partyA: string;
  partyB: string;
  stake: number;
  description: string;
}) {

  const { escrowAddress, winner, partyA, partyB, stake, description } = params;

  const a = partyA.toLowerCase();
  const b = partyB.toLowerCase();
  const w = winner.toLowerCase();

  const timestamp = Date.now();

  const players = [
    {
      wallet: a,
      opponent: b,
      result: w === a ? "WIN" : "LOSS",
    },
    {
      wallet: b,
      opponent: a,
      result: w === b ? "WIN" : "LOSS",
    },
  ];

  for (const player of players) {

    /* ----------------------------- */
    /* History document reference */
    /* ----------------------------- */

    const historyRef = doc(
      db,
      "profiles",
      player.wallet,
      "history",
      escrowAddress
    );

    /* ----------------------------- */
    /* Prevent duplicate processing */
    /* ----------------------------- */

    const existing = await getDoc(historyRef);

    if (existing.exists()) {
      // History already recorded → skip stats update
      continue;
    }

    /* ----------------------------- */
    /* Write history record */
    /* ----------------------------- */

    await setDoc(historyRef, {
      escrowAddress,
      result: player.result,
      opponent: player.opponent,
      stake,
      description,
      timestamp,
    });

    /* ----------------------------- */
    /* Update profile stats */
    /* ----------------------------- */

    const profileRef = doc(db, "profiles", player.wallet);

    await updateDoc(profileRef, {
      "stats.totalWagers": increment(1),
      "stats.totalVolumeEth": increment(stake),
      ...(player.result === "WIN"
        ? { "stats.wins": increment(1) }
        : { "stats.losses": increment(1) }),
    });

  }
}