
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { User } from "firebase/auth";

// Call this function right after a user successfully signs up or logs in for the first time
export const createUserProfileDocument = async (user: User) => {
  if (!user || !firestore) return;

  const userRef = doc(firestore, "users", user.uid);
  const userData = {
    uid: user.uid,
    email: user.email ?? null,
    name: user.displayName || (user.isAnonymous ? "Guest User" : user.email?.split('@')[0]) || "User",
    createdAt: serverTimestamp(),
    isAnonymous: user.isAnonymous,
  };

  try {
    // Use { merge: true } to prevent overwriting existing data on login
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error creating user profile document:", error);
    // Add production-ready error handling (e.g., logging to a service)
  }
};
