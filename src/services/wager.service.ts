import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const wagersCollection = collection(db, "wagers");

export const createWagerRecord = async (data: any) => {
  return addDoc(wagersCollection, {
    escrowAddress: data.escrowAddress.toLowerCase(),
    description: data.description,
    partyA: data.partyA,
    partyB: data.partyB,
    stake: data.stake,
    deadline: data.deadline,
    createdAt: serverTimestamp(),
    status: "open",
  });
};

export const updateWagerStatus = async (
  wagerId: string,
  status: string
) => {
  const wagerRef = doc(db, "wagers", wagerId);

  await updateDoc(wagerRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const getWagerMetadataByEscrow = async (
  escrowAddress: string
) => {
  const q = query(
    wagersCollection,
    where("escrowAddress", "==", escrowAddress.toLowerCase())
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  return snap.docs[0].data();
};