// Firebase JS SDK for Expo
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCe9C8JGzKLwBCP7K4HSRleZHcCwGd91iI",
  authDomain: "d-bot-a8646.firebaseapp.com",
  projectId: "d-bot-a8646",
  storageBucket: "d-bot-a8646.firebasestorage.app",
  messagingSenderId: "457794456593",
  appId: "1:457794456593:web:6f9772ea98746dce5eb5b0",
  measurementId: "G-C24ZZ8QCPD"
};

// Initialize Firebase (only if not already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
let auth;

if (Platform.OS === 'web') {
  // Web platform - use getAuth
  auth = getAuth(app);
} else {
  // React Native platform - MUST use initializeAuth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized' || 
        error.message?.includes('already-initialized')) {
      auth = getAuth(app);
    } else {
      console.error('Firebase Auth initialization error:', error);
      throw error;
    }
  }
}

export { auth, app };
