import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Profile } from "../types/profile.types";

/* =========================================================
   Ensure Profile Exists
   Creates profile if first login
========================================================= */

export async function ensureProfile(
  wallet: string,
  authProvider: "metamask" | "web3auth" = "metamask"
): Promise<Profile> {

  const walletKey = wallet.toLowerCase();
  const ref = doc(db, "profiles", walletKey);

  const snap = await getDoc(ref);
  const now = Date.now();

  /* --------------------------------------------------------
     First Time User
  -------------------------------------------------------- */

  if (!snap.exists()) {

    const newProfile: Profile = {
      wallet: walletKey,

      identity: {
        username: null,
        displayName: null,
        avatarUrl: null,
        bio: null,
      },

      stats: {
        wins: 0,
        losses: 0,
        pushes: 0,
        totalWagers: 0,
        totalVolumeEth: 0,
      },

      meta: {
        createdAt: now,
        lastLoginAt: now,
        authProvider,
      },
    };

    await setDoc(ref, newProfile);

    return newProfile;
  }

  /* --------------------------------------------------------
     Existing User
  -------------------------------------------------------- */

  const existingProfile = snap.data() as Profile;

  await updateDoc(ref, {
    "meta.lastLoginAt": now,
  });

  return {
    ...existingProfile,
    meta: {
      ...existingProfile.meta,
      lastLoginAt: now,
    },
  };
}


/* =========================================================
   Fetch Profile
========================================================= */

export async function getProfile(wallet: string): Promise<Profile | null> {

  const walletKey = wallet.toLowerCase();
  const ref = doc(db, "profiles", walletKey);

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as Profile;
}


/* =========================================================
   Update Profile Identity
   (username / displayName / avatar / bio)
========================================================= */

export async function updateProfileIdentity(
  wallet: string,
  updates: Partial<Profile["identity"]>
): Promise<void> {

  const walletKey = wallet.toLowerCase();
  const ref = doc(db, "profiles", walletKey);

  const payload: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[`identity.${key}`] = value;
    }
  });

  if (Object.keys(payload).length === 0) return;

  await updateDoc(ref, payload);
}