import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAkFWf74yj_1o-Bx9KQwp0354nBrPFCsxA",
  authDomain: "escape-room-bb563.firebaseapp.com",
  projectId: "escape-room-bb563",
  storageBucket: "escape-room-bb563.firebasestorage.app",
  messagingSenderId: "939585325796",
  appId: "1:939585325796:web:3a1ff723706dd0be77faf1",
  measurementId: "G-6EEF5QL9JT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 