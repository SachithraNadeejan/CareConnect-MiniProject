import { database } from "./firebaseConfig";
import { ref, set, get, update, remove, onValue } from "firebase/database";

// Write data to the database
export const writeData = async (path, data) => {
  const dbRef = ref(database, path);
  return await set(dbRef, data);
};

// Read data from the database
export const readData = async (path) => {
  const dbRef = ref(database, path);
  const snapshot = await get(dbRef);
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    throw new Error("No data available");
  }
};

// Update data in the database
export const updateData = async (path, data) => {
  const dbRef = ref(database, path);
  return await update(dbRef, data);
};

// Delete data from the database
export const deleteData = async (path) => {
  const dbRef = ref(database, path);
  return await remove(dbRef);
};

// Listen for real-time updates
export const listenToData = (path, callback) => {
  const dbRef = ref(database, path);
  onValue(dbRef, (snapshot) => {
    callback(snapshot.val());
  });
};
