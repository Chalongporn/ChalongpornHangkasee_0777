// firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAlb4GI7Uqj6mQ7C3hDoilZQ7IEcZakASQ",
  authDomain: "mini-proj3k-mo.firebaseapp.com",
  projectId: "mini-proj3k-mo",
  storageBucket: "mini-proj3k-mo.firebasestorage.app",
  messagingSenderId: "456173675145",
  appId: "1:456173675145:web:53bcfe388639a2e4899c58",
  measurementId: "G-LNE881JMYQ",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
