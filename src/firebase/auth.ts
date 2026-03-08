// src/firebase/auth.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  User
} from "firebase/auth";

import { auth } from "./firebase";

/* =========================================================
   SESSION CONFIG
   Ensures login only lasts for the browser session
========================================================= */

const applySessionPersistence = async () => {
  await setPersistence(auth, browserSessionPersistence);
};

/* =========================================================
   EMAIL REGISTER
========================================================= */

export const registerWithEmail = async (
  email: string,
  password: string
) => {

  await applySessionPersistence();

  return createUserWithEmailAndPassword(auth, email, password);
};

/* =========================================================
   EMAIL LOGIN
========================================================= */

export const loginWithEmail = async (
  email: string,
  password: string
) => {

  await applySessionPersistence();

  return signInWithEmailAndPassword(auth, email, password);
};

/* =========================================================
   GOOGLE LOGIN
========================================================= */

export const loginWithGoogle = async () => {

  await applySessionPersistence();

  const provider = new GoogleAuthProvider();

  return signInWithPopup(auth, provider);
};

/* =========================================================
   LOGOUT
========================================================= */

export const logoutUser = async () => {
  return signOut(auth);
};

/* =========================================================
   AUTH STATE LISTENER
   Used by useAuth() hook
========================================================= */

export const onAuthChange = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};