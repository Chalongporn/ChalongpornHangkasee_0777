import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function registerUser(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "Users", user.uid), {
    UserID: user.uid,
    Username: username || "",
    Email: user.email,
    Password: password,
    ProfilePic: "",
    Profile_picture: "",
    Status: "user"
  });

  await setDoc(doc(db, "Score", user.uid), {
    UserID: user.uid,
    Username: username || "",
    ScoreID: user.uid,
    Round: 0,
    Score: 0,
  });

  return user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
