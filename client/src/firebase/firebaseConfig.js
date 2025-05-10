import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCe0OCNXPbuEcKV1CYvlN0eMSBzBoURxfY",
    authDomain: "care-connect-f3c83.firebaseapp.com",
    databaseURL: "https://care-connect-f3c83-default-rtdb.firebaseio.com",
    projectId: "care-connect-f3c83",
    storageBucket: "care-connect-f3c83.firebasestorage.app",
    messagingSenderId: "396453218856",
    appId: "1:396453218856:web:f5a8a6a35ee2f4aee0831d"
  };


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);



