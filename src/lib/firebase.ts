import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA93DRroufk-IzMMbdX0h5WwjVEbfSwyfk",
  authDomain: "hgm-doc-backup.firebaseapp.com",
  projectId: "hgm-doc-backup",
  storageBucket: "hgm-doc-backup.firebasestorage.app",
  messagingSenderId: "879974628746",
  appId: "1:879974628746:web:8861baf787552aed67dc73",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const firestore = getFirestore(firebaseApp);

export { firebaseApp };
