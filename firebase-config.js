import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCFExYKkXxauIXVv2HzNHbNnizL6MF_p4",
  authDomain: "netlink-agencies-6399e.firebaseapp.com",
  projectId: "netlink-agencies-6399e",
  storageBucket: "netlink-agencies-6399e.firebasestorage.app",
  messagingSenderId: "546397751362",
  appId: "1:546397751362:web:c74e057b2b0ceb6c0745db",
  measurementId: "G-C6WE8JFTJ0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
