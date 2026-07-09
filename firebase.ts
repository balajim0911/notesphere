import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Config values from firebase-applet-config.json
const firebaseConfig = {
  projectId: "peerless-backup-g40ks",
  appId: "1:68077852901:web:162ba5131d39d6c497dc0c",
  apiKey: "AIzaSyDM2b6aJDsqQ97ExNN_grCs8qUKF7SELYI",
  authDomain: "peerless-backup-g40ks.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-notesphere3d-9ddaf1cd-bfe9-410e-b7cd-fd9088f4035e",
  storageBucket: "peerless-backup-g40ks.firebasestorage.app",
  messagingSenderId: "68077852901",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
