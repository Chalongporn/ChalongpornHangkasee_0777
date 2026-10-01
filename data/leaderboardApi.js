import { db } from "./firebaseConfig";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export async function fetchLeaderboard(top = 10) {
  const q = query(collection(db, "Score"), orderBy("Score", "desc"), limit(top));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
