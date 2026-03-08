import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function rebuildAllProfileStats() {

  console.log("Starting stat rebuild...");

  const profilesSnapshot = await getDocs(collection(db, "profiles"));

  for (const profileDoc of profilesSnapshot.docs) {

    const wallet = profileDoc.id;

    console.log("Rebuilding:", wallet);

    const historyRef = collection(db, "profiles", wallet, "history");
    const historySnapshot = await getDocs(historyRef);

    let wins = 0;
    let losses = 0;
    let totalWagers = 0;
    let totalVolumeEth = 0;

    historySnapshot.forEach((doc) => {

      const data = doc.data();

      totalWagers++;

      if (data.result === "WIN") wins++;
      if (data.result === "LOSS") losses++;

      if (data.stake) {
        totalVolumeEth += Number(data.stake);
      }

    });

    const profileRef = doc(db, "profiles", wallet);

    await setDoc(profileRef, {
      stats: {
        wins,
        losses,
        totalWagers,
        totalVolumeEth,
      }
    }, { merge: true });

    console.log("Updated stats:", {
      wallet,
      wins,
      losses,
      totalWagers,
      totalVolumeEth
    });

  }

  console.log("Stat rebuild complete.");
}