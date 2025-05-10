import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { ref, set, remove, onValue, get, update } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import { fetchUserData, logOut } from "../firebase/authService";
import { addOtherDonationItems } from "../firebase/adminService";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [wards, setWards] = useState([]);
  const [wardName, setWardName] = useState("");
  const [wardCapacity, setWardCapacity] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [meal, setMeal] = useState("breakfast");
  const [foodItem, setFoodItem] = useState("");
  const [foodQuantity, setFoodQuantity] = useState("");
  const [admin, setAdmin] = useState(null);
  const [activeSection, setActiveSection] = useState("addWard");
  const { setUserData, setIsLoggedin } = useContext(AppContent);
  const [bookings, setBookings] = useState({});
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setitemQuantity] = useState("");
  const [itemDescription, setitemDescription] = useState("");
  const [donationItems, setDonationItems] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [newFoodQuantity, setNewFoodQuantity] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editItemData, setEditItemData] = useState({});
  const [bookedUsers, setBookedUsers] = useState(null);

  const handleEditItem = (item) => {
    setEditingItem(item.id);
    setEditItemData({ ...item });
  };

  const handleUpdateItem = async () => {
    if (!editItemData.name || !editItemData.description || !editItemData.initialQty) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      const itemRef = ref(database, `otherdonations/${editingItem}`);
      const snapshot = await get(itemRef);

      if (!snapshot.exists()) {
        toast.error("Item not found.");
        return;
      }

      const itemData = snapshot.val();
      const oldInitialQty = itemData.initialQty;
      const oldRemainingQty = itemData.remainingQty;
      const newInitialQty = Number(editItemData.initialQty);

      // Adjust remainingQty based on the change in initialQty
      let newRemainingQty = oldRemainingQty + (newInitialQty - oldInitialQty);

      // Prevent negative remainingQty
      if (newRemainingQty < 0) {
        newRemainingQty = 0;
      }

      await update(itemRef, {
        name: editItemData.name,
        description: editItemData.description,
        initialQty: newInitialQty,
        remainingQty: newRemainingQty, // Ensure this updates too
      });

      toast.success("Item updated successfully!");
      setEditingItem(null);
    } catch (error) {
      toast.error("Failed to update item.");
    }
  };


  const handleDeleteItem = async (itemId) => {
    try {
      await remove(ref(database, `otherdonations/${itemId}`));
      toast.success("Item deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete item.");
    }
  };

  const viewBookedUsers = async (itemId) => {
    try {
      const bookingsRef = ref(database, "donationBookings");
      const snapshot = await get(bookingsRef);

      if (!snapshot.exists()) {
        setBookedUsers([]);
        return;
      }

      const bookings = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter((booking) => booking.itemId === itemId);

      // Fetch user details for each booking
      const userDetails = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const userRef = ref(database, `users/${booking.bookedBy}`); // Adjust if user data is stored elsewhere
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              return {
                ...booking,
                name: userData.name || "Unknown",
                email: userData.email || "Not Available",
                phone: userData.mobile || "Not Available",
              };
            }
          } catch (error) {
            console.error("Error fetching user data:", error.message);
          }
          return {
            ...booking,
            name: "Unknown",
            email: "Not Available",
            phone: "Not Available",
          };
        })
      );

      setBookedUsers(userDetails);
    } catch (error) {
      toast.error("Failed to fetch booked users.");
    }
  };





  //fetch other donation items
  useEffect(() => {
    const itemsRef = ref(database, "otherdonations");
    const unsubscribeItems = onValue(itemsRef, (snapshot) => {
      if (snapshot.exists()) {
        setDonationItems(Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })));
      } else {
        setDonationItems([]);
      }
    });

    return () => unsubscribeItems();
  }, []);


  // Helper function to get the days of the current month
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthIndex = today.getMonth();

      // Get all the days of the current month
      const daysOfMonth = getDaysInMonth(currentYear, currentMonthIndex);
      setDaysInMonth(daysOfMonth);

      const bookingsRef = ref(database, `bookings`);
      const snapshot = await get(bookingsRef);

      if (snapshot.exists()) {
        const allBookings = snapshot.val();
        const monthlyBookings = {};

        // Loop through all bookings and group by date
        Object.entries(allBookings).forEach(([date, meals]) => {
          const mealData = {};
          Object.entries(meals).forEach(([meal, bookingsForMeal]) => {
            if (!mealData[meal]) mealData[meal] = [];
            mealData[meal].push(bookingsForMeal);
          });
          monthlyBookings[date] = mealData;
        });

        setBookings(monthlyBookings);
      } else {
        setBookings({});
      }
    };

    fetchBookings();
  }, [currentMonth]);

  const handleEditFoodItem = (wardId, meal, foodItem, currentQty) => {
    setEditingFood({ wardId, meal, foodItem });
    setNewFoodQuantity(currentQty);
  };

  const updateFoodItem = async () => {
    if (!editingFood || !newFoodQuantity) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    const { wardId, meal, foodItem } = editingFood;
    const foodRef = ref(database, `wards/${wardId}/foodRequirements/${meal}/${foodItem}`);

    try {
      await set(foodRef, newFoodQuantity);
      toast.success("Food item updated successfully!");
      setEditingFood(null);
      setNewFoodQuantity("");
    } catch (error) {
      console.error("Error updating food item:", error.message);
      toast.error("Failed to update food item.");
    }
  };


  const deleteFoodItem = async (wardId, meal, foodItem) => {
    const foodRef = ref(database, `wards/${wardId}/foodRequirements/${meal}/${foodItem}`);

    try {
      await remove(foodRef);
      toast.success("Food item deleted successfully!");
    } catch (error) {
      console.error("Error deleting food item:", error.message);
      toast.error("Failed to delete food item.");
    }
  };



  const mealColors = {
    breakfast: "bg-yellow-200", // Yellow for breakfast
    lunch: "bg-green-200",      // Green for lunch
    dinner: "bg-red-200",       // Red for dinner
    tea: "bg-blue-200",         // Blue for tea
  };

  // Check if a meal is booked for a specific day
  const isMealBooked = (date, meal) => {
    const formattedDate = date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
    return bookings[formattedDate] && bookings[formattedDate][meal];
  };


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "careconnect69@gmail.com") {
        setAdmin(true);
      } else {
        navigate("/login");
      }
    });

    const wardsRef = ref(database, "wards");
    const unsubscribeData = onValue(wardsRef, (snapshot) => {
      if (snapshot.exists()) {
        setWards(Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })));
      } else {
        setWards([]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, [navigate]);





  // Add a new ward with a custom capacity
  const addWard = async () => {
    if (!wardName || !wardCapacity) {
      toast.error("Ward name and capacity are required!");
      return;
    }

    const wardId = wardName.replace(/\s+/g, "_").toLowerCase();
    const wardRef = ref(database, `wards/${wardId}`);

    try {
      await set(wardRef, {
        name: wardName,
        capacity: Number(wardCapacity),
        foodRequirements: {
          breakfast: {},
          lunch: {},
          dinner: {},
          tea: {},
        },
      });
      toast.success("Ward added successfully!");
      setWardName("");
      setWardCapacity("");
    } catch (error) {
      console.error("Error adding ward:", error.message);
      toast.error("Failed to add ward.");
    }
  };

  // Add a new items for other donations
  const addItem = async () => {
    if (!itemName || !itemDescription || !itemQuantity) {
      toast.error("Item name, description, and quantity are required!");
      return;
    }

    const qty = Number(itemQuantity); // Convert to number

    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be a valid number greater than 0!");
      return;
    }

    try {
      await addOtherDonationItems(itemName, qty, itemDescription); // Call the backend function
      toast.success("Item added successfully!");

      // Reset input fields after adding
      setItemName("");
      setitemDescription("");
      setitemQuantity("");
    } catch (error) {
      console.error("Error adding item:", error.message);
      toast.error("Failed to add item.");
    }
  };


  // Add food item to a ward for a specific meal
  const addFoodItem = async () => {
    if (!selectedWard || !foodItem || !foodQuantity) {
      toast.error("All fields are required!");
      return;
    }

    const foodRef = ref(database, `wards/${selectedWard}/foodRequirements/${meal}/${foodItem}`);

    try {
      await set(foodRef, foodQuantity);
      toast.success("Food item added successfully!");
      setFoodItem("");
      setFoodQuantity("");
    } catch (error) {
      console.error("Error adding food item:", error.message);
      toast.error("Failed to add food item.");
    }
  };

  // Delete a ward
  const deleteWard = async (wardId) => {
    const wardRef = ref(database, `wards/${wardId}`);

    try {
      await remove(wardRef);
      toast.success("Ward deleted successfully!");
    } catch (error) {
      console.error("Error deleting ward:", error.message);
      toast.error("Failed to delete ward.");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();
      setIsLoggedin(false);
      setAdmin(false);
      setUserData(null);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error.message);
      toast.error("Failed to log out.");
    }
  };


  if (admin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  // Show tooltip with booking details on hover
  const handleMouseEnter = async (meal, date, event) => {
    const formattedDate = date.toISOString().split("T")[0];
    const mealBookings = bookings[formattedDate] && bookings[formattedDate][meal];

    if (mealBookings) {
      const userDetails = await Promise.all(
        mealBookings.map(async (booking) => {
          try {
            const userData = await fetchUserData(booking.bookedBy);
            return {
              ward: booking.ward || "No Ward",
              name: userData?.name || "Unknown",
              phone: userData?.mobile || "Not Available",
              email: userData?.email || "Not Available",
              time: new Date(booking.timestamp).toLocaleTimeString(),
            };
          } catch (error) {
            console.error("Error fetching user data:", error.message);
            return {
              ward: "No Ward",
              name: "Unknown",
              phone: "Not Available",
              email: "Not Available",
              time: new Date(booking.timestamp).toLocaleTimeString(),
            };
          }
        })
      );

      setTooltip({
        meal,
        date,
        userDetails,
        position: {
          top: event.clientY + 10, // Position slightly below the cursor
          left: event.clientX + 10, // Position slightly to the right of the cursor
        },
      });
    }
  };


  const handleMouseLeave = () => {
    setTooltip(null);
  };


  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        id="default-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-indigo-800">
          <ul className="space-y-2 font-medium">
            <li>
              <button
                onClick={() => setActiveSection("addWard")}
                className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${activeSection === "addWard" ? "bg-gray-200 dark:bg-gray-700" : ""
                  }`}
              >
                <span className="ms-3">Add Ward</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveSection("addFoodItem")}
                className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${activeSection === "addFoodItem" ? "bg-gray-200 dark:bg-gray-700" : ""
                  }`}
              >
                <span className="ms-3">Add Food Item</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveSection("viewWards")}
                className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${activeSection === "viewWards" ? "bg-gray-200 dark:bg-gray-700" : ""
                  }`}
              >
                <span className="ms-3">View Wards</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveSection("viewBookings")}
                className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${activeSection === "viewBookings" ? "bg-gray-200 dark:bg-gray-700" : ""
                  }`}
              >
                <span className="ms-3">View Bookings</span>
              </button>
            </li>

            <li>
              <hr className="my-2 border-white" />
            </li>


            <li>
              <button
                onClick={() => setActiveSection("addItems")}
                className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${activeSection === "addItems" ? "bg-gray-200 dark:bg-gray-700" : ""
                  }`}
              >
                <span className="ms-3">Add Other Donation Items</span>
              </button>

            </li>

            <li>
              <li>
                <button
                  onClick={() => setActiveSection("viewItems")}
                  className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${activeSection === "viewItems" ? "bg-gray-200 dark:bg-gray-700" : ""
                    }`}
                >
                  <span className="ms-3">View Donation Items</span>
                </button>
              </li>

            </li>

            <li>
              <button
                onClick={handleLogout}
                className="flex items-center p-2 w-full text-gray-900 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                <span className="ms-3">Logout</span>
              </button>
            </li>

          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className="p-4 sm:ml-64">
        {activeSection === "addWard" && (
          <div className="bg-gray-100 shadow-lg rounded p-6 ml-72 mt-52">
            <h2 className="text-xl font-bold mb-4">Add New Ward</h2>
            <input
              type="text"
              placeholder="Enter ward name"
              value={wardName}
              onChange={(e) => setWardName(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="number"
              placeholder="Enter capacity"
              value={wardCapacity}
              onChange={(e) => setWardCapacity(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={addWard}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Add Ward
            </button>
          </div>
        )}

        {activeSection === "addFoodItem" && (
          <div className="bg-gray-100 shadow-lg rounded p-6 ml-36 mt-36">
            <h2 className="text-xl font-bold mb-4"><center>Add Food Item</center></h2>
            <select
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="">Select Ward</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
            <select
              onChange={(e) => setMeal(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="tea">Tea</option>
            </select>
            <input
              type="text"
              placeholder="Enter food item"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Enter quantity e.g - 20 kg or 5L"
              value={foodQuantity}
              onChange={(e) => setFoodQuantity(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={addFoodItem}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              disabled={!selectedWard}
            >
              Add Food Item
            </button>
          </div>
        )}


        {activeSection === "viewItems" && (
          <div className="bg-gray-100 shadow-lg rounded p-6 ml-1 mt-10">
            <h2 className="text-xl font-bold mb-4"><center>Donation Items</center></h2>

            {donationItems.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 p-2">Item Name</th>
                    <th className="border border-gray-300 p-2">Needed Quantity</th>
                    <th className="border border-gray-300 p-2">Remaining Quantity</th>
                    <th className="border border-gray-300 p-2">Booked Quantity</th>
                    <th className="border border-gray-300 p-2">Description</th>
                    <th className="border border-gray-300 p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donationItems.map((item) => (
                    <tr key={item.id} className="border border-gray-300">
                      <td className="border border-gray-300 p-2">{item.name}</td>
                      <td className="border border-gray-300 p-2">{item.initialQty}</td>
                      <td className="border border-gray-300 p-2">{item.remainingQty}</td>
                      <td className="border border-gray-300 p-2">
                        {item.initialQty - item.remainingQty} {/* Total booked qty */}
                      </td>
                      <td className="border border-gray-300 p-2">{item.description}</td>
                      <td className="border border-gray-300 p-2 flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => viewBookedUsers(item.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                        >
                          View Bookings
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No donation items available.</p>
            )}

            {/* Edit Modal */}
            {editingItem && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                  <h2 className="text-lg font-semibold mb-4">Edit Item</h2>
                  <input
                    type="text"
                    value={editItemData.name}
                    onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Item Name"
                  />
                  <textarea
                    value={editItemData.description}
                    onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Item Description"
                  />
                  <input
                    type="number"
                    value={editItemData.initialQty}
                    onChange={(e) => setEditItemData({ ...editItemData, initialQty: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Initial Quantity"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="mr-2 px-4 py-2 bg-gray-500 text-white rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Booked Users Modal */}
            {bookedUsers && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                <div className="bg-white p-8 rounded-lg shadow-lg w-[600px]">
                  <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Booked Users</h2>

                  {bookedUsers.length > 0 ? (
                    <div className="space-y-4">
                      {bookedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-4 border rounded-lg shadow-md bg-gray-50 flex flex-col sm:flex-row justify-between items-center"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="bg-indigo-500 text-white h-12 w-12 flex items-center justify-center rounded-full text-xl font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-gray-700">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <p className="text-sm text-gray-500">{user.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-md font-bold text-indigo-600">{user.bookedQty} Items</p>
                            <p className="text-sm text-gray-600">{new Date(user.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No users have booked this item.</p>
                  )}

                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setBookedUsers(null)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}


        {editingFood && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-semibold mb-4">Edit Food Item</h2>
              <p><strong>Ward:</strong> {editingFood.wardId}</p>
              <p><strong>Meal:</strong> {editingFood.meal}</p>
              <p><strong>Food Item:</strong> {editingFood.foodItem}</p>

              <input
                type="text"
                value={newFoodQuantity}
                onChange={(e) => setNewFoodQuantity(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="Enter new quantity"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => setEditingFood(null)}
                  className="mr-2 px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={updateFoodItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}



        {/* add donation items */}

        {activeSection === "addItems" && (
          <div className="bg-gray-100 shadow-lg rounded p-6 mt-40 ml-40">
            <h2 className="text-xl font-bold mb-4"><center>Add New Item</center></h2>
            <input
              type="text"
              placeholder="Enter item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <textarea
              placeholder="Enter Description"
              value={itemDescription}
              onChange={(e) => setitemDescription(e.target.value)}
              className="w-full p-2 border rounded mb-2 h-24 resize-none"
            />
            <input
              type="number"
              placeholder="Enter initial quantity"
              value={itemQuantity}
              onChange={(e) => setitemQuantity(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={addItem}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Add Item
            </button>
          </div>
        )}



        {activeSection === "viewWards" && (
          <div className="bg-gray-100 shadow-lg rounded p-6 ml-10 mt-10">
            <h2 className="text-xl font-bold mb-4"><center>Wards</center></h2>
            {wards.length === 0 ? (
              <p className="text-gray-500">No wards available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wards.map((ward) => (
                  <div key={ward.id} className="bg-white shadow-md rounded-lg p-4 border">
                    <h3 className="text-lg font-bold">{ward.name || "No Name"}</h3>
                    <p className="text-sm text-gray-500">Capacity: {ward.capacity || "N/A"}</p>

                    <div className="mt-2">
                      <h4 className="font-semibold">Food Requirements:</h4>
                      {["breakfast", "lunch", "dinner", "tea"].map((meal) => (
                        <div key={meal} className="mb-2">
                          <p className="font-semibold">{meal.charAt(0).toUpperCase() + meal.slice(1)}:</p>
                          <ul className="list-disc pl-6">
                            {ward.foodRequirements?.[meal] && Object.keys(ward.foodRequirements[meal]).length > 0 ? (
                              Object.entries(ward.foodRequirements[meal]).map(([item, qty]) => (
                                <li key={item} className="flex justify-between items-center">
                                  <span>{item}: {qty}</span>
                                  <div>
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => handleEditFoodItem(ward.id, meal, item, qty)}
                                      className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
                                    >
                                      Edit
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => deleteFoodItem(ward.id, meal, item)}
                                      className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-500">No items added</li>
                            )}
                          </ul>
                        </div>
                      ))}

                    </div>

                    <button
                      onClick={() => deleteWard(ward.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition mt-4"
                    >
                      Delete Ward
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeSection === "viewBookings" && (
          <div className="p-4 ml-36 bg-gray-100">
            <h2 className="text-2xl font-bold mb-4"><center>Bookings Calendar</center></h2>
            <div className="grid grid-cols-7 gap-7">
              {/* Day Names */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <div key={index} className="font-semibold text-center">{day}</div>
              ))}
              {/* Calendar Dates */}
              {daysInMonth.map((date, index) => {
                const formattedDate = date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={index}
                    className={`p-4 text-center border rounded-lg ${isToday ? "bg-blue-300" : "bg-white"
                      }`}
                  >
                    <div className="font-semibold">{date.getDate()}</div>

                    {/* Show meal types if booked */}
                    {["breakfast", "lunch", "tea", "dinner"].map((meal, mealIndex) => (
                      <div
                        key={mealIndex}
                        className={`my-1 p-1 rounded ${isMealBooked(date, meal) ? mealColors[meal] : "bg-gray-100"}`}
                        onMouseEnter={(event) => handleMouseEnter(meal, date, event)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {isMealBooked(date, meal) ? meal.charAt(0).toUpperCase() + meal.slice(1) : ""}
                      </div>

                    ))}
                  </div>
                );
              })}
            </div>

            {/* Tooltip for user details */}
            {tooltip && (
              <div
                className="absolute bg-white shadow-lg p-4 rounded-lg border"
                style={{
                  top: `${tooltip.position.top}px`,
                  left: `${tooltip.position.left}px`,
                  position: "absolute",
                  zIndex: 9999,
                  maxWidth: "300px",
                }}
              >
                <h4 className="font-semibold mb-2">
                  {tooltip.meal.charAt(0).toUpperCase() + tooltip.meal.slice(1)} Bookings for {new Date(tooltip.date).toLocaleDateString()}
                </h4>
                {tooltip.userDetails.map((user, index) => (
                  <div key={index}>
                    <p><strong>Ward:</strong> {user.ward}</p>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Booking Time:</strong> {user.time}</p>
                    <hr />
                  </div>
                ))}
              </div>
            )}



          </div>
        )}


      </div>
    </div>
  );
};

export default AdminPanel;
