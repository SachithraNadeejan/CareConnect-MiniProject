import { useEffect, useState } from "react";
import { getAvailableDonationItems, bookDonationItem } from "../firebase/userService";
import { auth } from "../firebase/firebaseConfig";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const OtherDonations = () => {
  const [donationItems, setDonationItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingQty, setBookingQty] = useState("");
  const navigate = useNavigate();


  // Fetch available donation items
  useEffect(() => {
    const fetchItems = async () => {
      if (!auth.currentUser) {
        toast.warning("You must be logged in to fetch available items.");
        navigate("/login");
        return;
      }
      setLoading(true);
      try {
        const items = await getAvailableDonationItems();
        setDonationItems(items);
      } catch (error) {
        toast.error("Failed to fetch donation items.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchItems();
  }, [navigate]);
  

  // Handle booking an item
  const handleBooking = async () => {
    if (!auth.currentUser) {
      toast.error("You must be logged in to book an item.");
      return;
    }

    if (!selectedItem || !bookingQty) {
      toast.warn("Please select an item and enter quantity.");
      return;
    }

    const requestedQty = Number(bookingQty);

    if (isNaN(requestedQty) || requestedQty <= 0) {
      toast.error("Invalid quantity entered.");
      return;
    }

    if (requestedQty > selectedItem.remainingQty) {
      toast.error("Not enough stock available.");
      return;
    }

    setLoading(true);
    try {
      await bookDonationItem(auth.currentUser.uid, selectedItem.id, requestedQty);
      toast.success("Item booked successfully!");

      // Update UI after successful booking
      setDonationItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItem.id
            ? { ...item, remainingQty: item.remainingQty - requestedQty }
            : item
        )
      );

      // Reset selection
      setSelectedItem(null);
      setBookingQty("");
    } catch (error) {
      toast.error(error.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
        <Navbar />
      <div className="container mx-auto p-6 max-w-4xl bg-white shadow-lg rounded-lg mt-10">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          Available Donation Items
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading items...</p>
        ) : donationItems.length === 0 ? (
          <p className="text-center text-gray-500">No items available for donation.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {donationItems.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg shadow-md bg-white">
                <h2 className="text-xl font-bold text-indigo-600">{item.name}</h2>
                <p className="text-gray-600">{item.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>Initial Quantity:</strong> {item.initialQty}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Remaining Quantity:</strong> {item.remainingQty}
                </p>
                <button
                  onClick={() => setSelectedItem(item)}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  Book Item
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Booking Form */}
        {selectedItem && (
          <div className="mt-8 p-6 bg-gray-50 border rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-700">
              Booking: {selectedItem.name}
            </h2>
            <p className="text-gray-600">{selectedItem.description}</p>
            <p className="text-sm text-gray-500">
              <strong>Available:</strong> {selectedItem.remainingQty}
            </p>

            <input
              type="number"
              placeholder="Enter quantity"
              value={bookingQty}
              onChange={(e) => setBookingQty(e.target.value)}
              className="w-full p-2 border rounded mt-2"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedItem(null)}
                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtherDonations;
