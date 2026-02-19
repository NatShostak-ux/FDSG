import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCVVjB1cmdeDPLuR4KrDqw54H_2wlFn51E",
    authDomain: "fdsg-strategy-hub.firebaseapp.com",
    projectId: "fdsg-strategy-hub",
    storageBucket: "fdsg-strategy-hub.firebasestorage.app",
    messagingSenderId: "413022208913",
    appId: "1:413022208913:web:1f204a7d237eb396759030",
    measurementId: "G-9B3M0CTZ6Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
};

export const logout = () => signOut(auth);
