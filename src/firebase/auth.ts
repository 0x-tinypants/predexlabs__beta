// src/firebase/auth.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth } from "./firebase";

// Email Register
export const registerWithEmail = async (
  email: string,
  password: string
) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Email Login
export const loginWithEmail = async (
  email: string,
  password: string
) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Google Login
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Logout
export const logoutUser = async () => {
  return signOut(auth);
};

// Auth Listener
export const onAuthChange = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};