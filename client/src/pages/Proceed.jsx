import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getWardFoodRequirements, bookWard } from "../firebase/userService";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-toastify"; 

const Proceed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const wardId = params.get("ward");
  const date = params.get("date");
  const meal = params.get("meal");
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch food requirements for the selected ward and meal
  useEffect(() => {
    const fetchFoodRequirements = async () => {
      try {
        const requirements = await getWardFoodRequirements(wardId, meal);
        setItems(requirements || {});
        toast.success("Food requirements loaded successfully!");
      } catch (error) {
        console.error("Error fetching food requirements:", error.message);
        toast.error("Failed to fetch food requirements.");
      }
    };

    fetchFoodRequirements();
  }, [wardId, meal]);

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!auth.currentUser) {
      toast.error("You must be logged in to confirm the booking.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      await bookWard(userId, date, meal, wardId);
      toast.success("Booking confirmed! Thank you for your donation.");
      navigate("/donate"); // Redirect back to the donation page
    } catch (error) {
      console.error("Error confirming booking:", error.message);
      toast.error("Failed to confirm the booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">
          Donation Details
        </h1>
        <p className="text-center text-gray-700 mb-6">
          You are donating to <strong>{wardId.charAt(0).toUpperCase() + wardId.slice(1)}</strong> for{" "}
          <strong>{meal.charAt(0).toUpperCase() + meal.slice(1)}</strong> on <strong>{date}</strong>.
        </p>

        <div className="bg-white p-6 shadow-lg rounded-md">
          <h2 className="text-xl font-bold mb-4">Items Required</h2>
          <ul className="list-disc space-y-2 pl-6">
            {items && Object.keys(items).length > 0 ? (
              Object.entries(items).map(([item, qty]) => (
                <li key={item}>
                  {item}: {qty}
                </li>
              ))
            ) : (
              <p>No items required for this meal.</p>
            )}
          </ul>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={handleConfirmBooking}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Proceed;
