import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getAvailableWards } from "../firebase/userService";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-toastify";

const Donate = () => {
  const navigate = useNavigate();
  const [donationDate, setDonationDate] = useState("");
  const [meal, setMeal] = useState("breakfast");
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchAvailableWards = async () => {
    if (!auth.currentUser) {
      toast.warning("You must be logged in to fetch available wards.");
      navigate("/login");
      return;
    }

    if (!donationDate || !meal) {
      toast.warn("Please select a date and meal.");
      return;
    }

    setLoading(true);
    try {
      const availableWards = await getAvailableWards(donationDate, meal);
      setWards(availableWards);
      toast.success("Wards fetched successfully!");
    } catch (error) {
      console.error(error.message);
      toast.error("Failed to fetch available wards.");
    } finally {
      setLoading(false);
    }
  };

  const otherDonations = () => {
    navigate('/otherDonations');
  }

  const handleProceed = (wardId) => {
    toast.info("Proceeding to donation details...");
    navigate(`/proceed?ward=${wardId}&date=${donationDate}&meal=${meal}`);
  };

  return (
    <div className="min-h-screen bg-white mt-20">
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mt-14 mb-8">
          Select a Ward for Meal Donation
        </h1>

        <div className="bg-gray-100 p-8 rounded-xl shadow-lg mb-8 text-center w-[700px] mx-auto">

          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2 ">
                Select Date for Your Donation
              </label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                min={(() => {
                  let date = new Date();
                  date.setDate(date.getDate() + 2);
                  return date.toISOString().split("T")[0];
                })()}
              />


            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Select Meal
              </label>
              <select
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="tea">Tea</option>
              </select>
            </div>

            <div className="text-center">
              <button
                onClick={fetchAvailableWards}
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Check Available Wards"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map((ward) => (
            <div
              key={ward.id}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-bold text-indigo-600 mb-3">
                {ward.name}
              </h2>
              <p className="text-gray-600 mb-4">Capacity: {ward.capacity}</p>
              <button
                onClick={() => handleProceed(ward.id)}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95"
              >
                Proceed to Donate
              </button>
            </div>
          ))}
        </div>
      </div>

      <h1 className="text-4xl font-bold text-center text-indigo-600 mt-8 mb-8">
        Other Donations
      </h1>


      <div className="bg-gray-100 p-8 rounded-xl shadow-lg mb-8 text-center w-[700px] mx-auto">
        <label className="block text-lg font-medium text-gray-700 mb-2">
          <ul>"Make a difference beyond food! Donate essential items like medical supplies,</ul>
          <ul>hygiene kits, and comfort essentials to support patients in need."</ul>
        </label>

        <button
          onClick={otherDonations}
          disabled={loadingItems}
          className="w-full sm:w-auto bg-indigo-600 mt-4 bg-center text-white px-8 py-3 rounded-lg hover:bg-indigo-700  transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingItems ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-3"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </span>
          ) : (
            "Go to Select Items"
          )}
        </button>
      </div>
    </div>
  );
};

export default Donate;