// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDkMkDJqaMZoALET5BtvG70ls7_wJ6Y8MU",
  authDomain: "end-pro-max.firebaseapp.com",
  projectId: "end-pro-max",
  storageBucket: "end-pro-max.firebasestorage.app",
  messagingSenderId: "213287144039",
  appId: "1:213287144039:web:9cf2f1d9f4b633cddc22c2",
  measurementId: "G-6MDP7J43LQ"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);
export { auth, db, storage };
