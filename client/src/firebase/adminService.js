import { ref, set, get, update, remove, onValue, push } from "firebase/database";
import { database } from "./firebaseConfig";

// Add a new ward
export const addWard = async (wardName, capacity = 50) => {
  try {
    const wardId = wardName.replace(/\s+/g, "_").toLowerCase();
    const wardRef = ref(database, `wards/${wardId}`);
    const snapshot = await get(wardRef);

    if (snapshot.exists()) {
      throw new Error("Ward already exists.");
    }

    await set(wardRef, {
      name: wardName,
      capacity,
      foodRequirements: {
        breakfast: {},
        lunch: {},
        dinner: {},
        tea: {},
      },
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Add or update food requirements for a ward
export const addFoodItem = async (wardId, meal, itemName, quantity) => {
  try {
    const foodRef = ref(database, `wards/${wardId}/foodRequirements/${meal}/${itemName}`);
    await set(foodRef, quantity);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete a ward
export const deleteWard = async (wardId) => {
  try {
    const wardRef = ref(database, `wards/${wardId}`);
    await remove(wardRef);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch all wards
export const getWards = async () => {
  try {
    const wardsRef = ref(database, "wards");
    const snapshot = await get(wardsRef);

    if (!snapshot.exists()) {
      return [];
    }

    return Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data,
    }));
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch available wards for a specific date and meal
export const getAvailableWards = async (date, meal) => {
  try {
    const bookingsRef = ref(database, `bookings/${date}/${meal}`);
    const bookingsSnapshot = await get(bookingsRef);

    const bookedWards = bookingsSnapshot.exists()
      ? Object.keys(bookingsSnapshot.val())
      : [];

    const allWards = await getWards();
    return allWards.filter((ward) => !bookedWards.includes(ward.id));
  } catch (error) {
    throw new Error(error.message);
  }
};


// add other donation items
export const addOtherDonationItems = async (item, qty, description) => {
  try {
    if (!item || typeof qty !== "number" || qty <= 0 || !description) {
      throw new Error("Invalid item name, quantity, or description.");
    }

    const itemRef = ref(database, "otherdonations");
    const newItemRef = push(itemRef); // Generate a unique item ID

    await set(newItemRef, {
      id: newItemRef.key,
      name: item,
      description,
      initialQty: qty, // Store the original stock
      remainingQty: qty, //Track the available stock separately
    });

    console.log("Item added successfully!");
  } catch (error) {
    throw new Error(error.message);
  }
};


// user booked other donations

export const getUserBookedItems = async (userId) => {
  try {
    const bookingsRef = ref(database, "donationBookings");
    const snapshot = await get(bookingsRef);

    if (!snapshot.exists()) {
      return [];
    }

    return Object.entries(snapshot.val())
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .filter((booking) => booking.bookedBy === userId);
  } catch (error) {
    console.error("Error fetching user bookings:", error.message);
    throw new Error("Failed to fetch user bookings.");
  }
};




