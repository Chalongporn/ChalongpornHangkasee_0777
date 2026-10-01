import { db } from "./firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function getUserScore(userId) {
  const ref = doc(db, "Score", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().Score || 0 : 0;
}

export async function updateUserScore(userId, amount) {
  const ref = doc(db, "Score", userId);
  const snap = await getDoc(ref);
  const currentScore = snap.exists() ? snap.data().Score || 0 : 0;
  const newScore = Math.max(currentScore + amount, 0);
  await updateDoc(ref, { Score: newScore });
  return newScore;
}
