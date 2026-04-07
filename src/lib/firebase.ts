import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { resolveFirebaseWebConfig } from "./firebase-config";

const firebaseConfig = resolveFirebaseWebConfig(import.meta.env);

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
