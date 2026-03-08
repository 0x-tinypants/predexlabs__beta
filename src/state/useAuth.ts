import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "../firebase/auth";
import { ensureProfile } from "../services/profile.service";
import { getProfile } from "../services/profile.service";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthChange(async (firebaseUser) => {

      if (!active) return;

      setUser(firebaseUser);

      if (!firebaseUser) {
        setWallet(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const walletId = firebaseUser.uid.toLowerCase();

        setWallet(walletId);

        // only create profile if this is a wallet login
        if (walletId.startsWith("0x")) {
          await ensureProfile(walletId, "metamask");
        }

        const profileData = await getProfile(walletId);

        if (active) {
          setProfile(profileData);
        }

      } catch (err) {
        console.error("Profile bootstrap failed:", err);
      }

      if (active) setLoading(false);

    });

    return () => {
      active = false;
      unsubscribe();
    };

  }, []);

  return {
    user,
    wallet,
    profile,
    loading,
    isAuthenticated: !!user,
  };
};