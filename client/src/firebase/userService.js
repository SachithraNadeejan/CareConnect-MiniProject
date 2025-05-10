import { ref, get, set, push, update } from "firebase/database";
import { database } from "./firebaseConfig";

// Book a ward
export const bookWard = async (userId, date, meal, wardId) => {
  try {
    const bookingRef = ref(database, `bookings/${date}/${meal}`);
    const snapshot = await get(bookingRef);

    if (snapshot.exists()) {
      throw new Error("This ward has already been booked for the selected date and meal.");
    }

    await set(bookingRef, {
      ward: wardId,
      bookedBy: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error booking ward:", error.message);
    throw new Error("Failed to book the ward.");
  }
};

// Fetch available wards for a specific date and meal
export const getAvailableWards = async (date, meal) => {
  try {
    const bookingsRef = ref(database, `bookings/${date}/${meal}`);
    const bookingsSnapshot = await get(bookingsRef);

    let bookedWards = new Set();

    if (bookingsSnapshot.exists()) {
      const bookingData = bookingsSnapshot.val();
      if (bookingData.ward) {
        bookedWards.add(bookingData.ward); // Add only the booked ward
      }
    }

    const wardsRef = ref(database, "wards");
    const wardsSnapshot = await get(wardsRef);

    if (!wardsSnapshot.exists()) {
      return [];
    }

    const allWards = Object.entries(wardsSnapshot.val()).map(([id, data]) => ({
      id,
      ...data,
    }));

    // Ensure filtering works correctly
    const availableWards = allWards.filter((ward) => !bookedWards.has(ward.id));

    console.log("Booked Ward:", Array.from(bookedWards)); // Debugging output
    console.log("Available Wards:", availableWards); // Debugging output

    return availableWards;
  } catch (error) {
    console.error("Error fetching available wards:", error.message);
    throw new Error("Failed to fetch available wards.");
  }
};

// Fetch food requirements for a specific ward and meal
export const getWardFoodRequirements = async (wardId, meal) => {
  try {
    const foodRef = ref(database, `wards/${wardId}/foodRequirements/${meal}`);
    const snapshot = await get(foodRef);

    if (!snapshot.exists()) {
      return {}; // Return an empty object if no food requirements exist
    }

    return snapshot.val(); // Return the food requirements
  } catch (error) {
    console.error("Error fetching ward food requirements:", error.message);
    throw new Error("Failed to fetch food requirements.");
  }
};


// Fetch available donation items with remaining quantity
export const getAvailableDonationItems = async () => {
  try {
    const itemsRef = ref(database, "otherdonations");
    const snapshot = await get(itemsRef);

    if (!snapshot.exists()) {
      return [];
    }

    return Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data,
    }));
  } catch (error) {
    console.error("Error fetching donation items:", error.message);
    throw new Error("Failed to fetch donation items.");
  }
};


export const bookDonationItem = async (userId, itemId, requestedQty) => {
  try {
    const itemRef = ref(database, `otherdonations/${itemId}`);
    const snapshot = await get(itemRef);

    if (!snapshot.exists()) {
      throw new Error("Item not found.");
    }

    const itemData = snapshot.val();

    if (itemData.remainingQty < requestedQty) {
      throw new Error("Not enough quantity available.");
    }

    // Update only the remaining quantity
    const newRemainingQty = itemData.remainingQty - requestedQty;

    await update(itemRef, { remainingQty: newRemainingQty });

    // Store booking in the "donationBookings" node
    const bookingRef = ref(database, "donationBookings");
    const newBookingRef = push(bookingRef);

    await set(newBookingRef, {
      id: newBookingRef.key,
      itemId: itemId,
      itemName: itemData.name,
      bookedBy: userId,
      bookedQty: requestedQty,
      timestamp: new Date().toISOString(),
    });

    console.log("Item booked successfully!");
    return { success: true, message: "Item booked successfully!" };
  } catch (error) {
    console.error("Error booking donation item:", error.message);
    throw new Error(error.message);
  }
};

