import type { FirebaseOptions } from "firebase/app";

type FirebaseConfigEnv = Record<string, string | undefined>;

export const DEFAULT_FIREBASE_WEB_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyAssj6JDFxQljT7LYQ1n3cBB9Ed1J4y3_M",
  authDomain: "p2p-hackathon.firebaseapp.com",
  projectId: "p2p-hackathon",
  storageBucket: "p2p-hackathon.firebasestorage.app",
  messagingSenderId: "935328974949",
  appId: "1:935328974949:web:1f4e0f2bbb6a8d79189e8c",
};

function readEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveFirebaseWebConfig(
  env: FirebaseConfigEnv,
): FirebaseOptions {
  return {
    apiKey:
      readEnvValue(env.VITE_FIREBASE_API_KEY) ??
      DEFAULT_FIREBASE_WEB_CONFIG.apiKey,
    authDomain:
      readEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN) ??
      DEFAULT_FIREBASE_WEB_CONFIG.authDomain,
    projectId:
      readEnvValue(env.VITE_FIREBASE_PROJECT_ID) ??
      DEFAULT_FIREBASE_WEB_CONFIG.projectId,
    storageBucket:
      readEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET) ??
      DEFAULT_FIREBASE_WEB_CONFIG.storageBucket,
    messagingSenderId:
      readEnvValue(env.VITE_FIREBASE_MESSAGING_SENDER_ID) ??
      DEFAULT_FIREBASE_WEB_CONFIG.messagingSenderId,
    appId:
      readEnvValue(env.VITE_FIREBASE_APP_ID) ??
      DEFAULT_FIREBASE_WEB_CONFIG.appId,
  };
}
