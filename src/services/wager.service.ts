import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const wagersCollection = collection(db, "wagers");

export const createWagerRecord = async (data: any) => {
  return addDoc(wagersCollection, {
    ...data,
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