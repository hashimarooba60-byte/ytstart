import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// NOTE: These are publicly visible demo keys. In a real production app, you should secure these.
const firebaseConfig = {
  apiKey: "AIzaSyApyq_UTImBfS9FcCw55J7fA3wxhgawClA",
  authDomain: "ytbee-a8deb.firebaseapp.com",
  databaseURL: "https://ytbee-a8deb-default-rtdb.firebaseio.com",
  projectId: "ytbee-a8deb",
  storageBucket: "ytbee-a8deb.appspot.com",
  messagingSenderId: "286068658853",
  appId: "1:286068658853:web:60aebfd7d7371d4068b34c",
  measurementId: "G-JT13B7SX5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();