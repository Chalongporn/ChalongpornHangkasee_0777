import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export async function fetchGames() {
  const snapshot = await getDocs(collection(db, "Game"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
