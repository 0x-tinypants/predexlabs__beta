import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { generateUsername } from "../utils/username";

const usersCollection = collection(db, "users");

const generateUniqueUsername = async (): Promise<{
  display: string;
  lower: string;
}> => {
  let attempts = 0;

  while (attempts < 5) {
    const usernameDisplay = generateUsername();
    const usernameLower = usernameDisplay.toLowerCase();

    const q = query(
      usersCollection,
      where("usernameLower", "==", usernameLower)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        display: usernameDisplay,
        lower: usernameLower,
      };
    }

    attempts++;
  }

  throw new Error("Failed to generate unique username");
};

export const createUserProfileIfMissing = async (
  uid: string,
  email: string | null
) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) return;

  const { display, lower } =
    await generateUniqueUsername();

  await setDoc(userRef, {
    uid,
    email,

    usernameDisplay: display,
    usernameLower: lower,
    usernameLastChangedAt: serverTimestamp(),

    walletAddress: null,

    createdAt: serverTimestamp(),

    verification: {
      walletVerified: false,
      handicapVerified: false,
      emailVerified: !!email,
    },

    stats: {
      totalWagers: 0,
      wins: 0,
      losses: 0,
      volumeUSDC: 0,
      disputesInitiated: 0,
      disputesWon: 0,
      disputesLost: 0,
    },

    reputation: {
      score: 50,
      tier: "Bronze",
      lastUpdated: serverTimestamp(),
    },
  });
};

export const updateUsername = async (
  uid: string,
  newUsername: string
) => {
  const usernameLower = newUsername.toLowerCase();

  const q = query(
    usersCollection,
    where("usernameLower", "==", usernameLower)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error("Username already taken");
  }

  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    usernameDisplay: newUsername,
    usernameLower,
    usernameLastChangedAt: serverTimestamp(),
  });
};