import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const activityCollection = collection(db, "activity");

export const logActivity = async (
  userId: string,
  type: string,
  metadata: any
) => {
  await addDoc(activityCollection, {
    userId,
    type,
    metadata,
    createdAt: serverTimestamp(),
  });
};