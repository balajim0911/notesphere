import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import sandboxConfig from './firebase-applet-config.json';

// Determine if we are running inside the AI Studio preview environment (Cloud Run container on *.run.app)
// If yes, we use the sandbox database and credentials.
// Otherwise, we use your production credentials for deployment/local development.
const isAiStudioSandbox = 
  typeof window !== 'undefined' && 
  (window.location.hostname.includes('run.app') || 
   window.location.hostname.includes('aistudio') || 
   window.location.hostname.includes('google.com'));

const getFirebaseConfig = () => {
  // 1. If custom environment variables are provided (highest priority), use them
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "default"
    };
  }

  // 2. If running inside AI Studio development/preview, use Sandbox config
  if (isAiStudioSandbox) {
    return {
      apiKey: sandboxConfig.apiKey,
      authDomain: sandboxConfig.authDomain,
      projectId: sandboxConfig.projectId,
      storageBucket: sandboxConfig.storageBucket,
      messagingSenderId: sandboxConfig.messagingSenderId,
      appId: sandboxConfig.appId,
      measurementId: sandboxConfig.measurementId || "",
      firestoreDatabaseId: sandboxConfig.firestoreDatabaseId
    };
  }

  // 3. Default to your personal production credentials (for local dev and production hosting deployments)
  return {
    apiKey: "AIzaSyA4b1xx2EpixiaMak5zkn2DtBTM2UQfTDc",
    authDomain: "my-notesphere-3d.firebaseapp.com",
    projectId: "my-notesphere-3d",
    storageBucket: "my-notesphere-3d.firebasestorage.app",
    messagingSenderId: "139560895651",
    appId: "1:139560895651:web:1c86fe9b03dde165e2eb16",
    measurementId: "G-NZKYZ2FN6N",
    firestoreDatabaseId: "default"
  };
};

export const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use the custom database ID if specified (e.g., in the sandbox)
export const db = firebaseConfig.firestoreDatabaseId && 
                  firebaseConfig.firestoreDatabaseId !== 'default' && 
                  firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

