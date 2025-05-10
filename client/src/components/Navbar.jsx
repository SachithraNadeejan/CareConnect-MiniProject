import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets.js";
import { useContext, useState, useEffect } from "react";
import { AppContent } from "../context/AppContext.jsx";
import { toast } from "react-toastify";
import { logOut, sendVerificationEmail } from "../firebase/authService";
import { auth } from "../firebase/firebaseConfig";

const Navbar = () => {
  const navigate = useNavigate();
  const { userData, setUserData, setIsLoggedin } = useContext(AppContent);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    if (userData) {
      setLoading(false); // Stop loading when userData is available
    } else {
      setLoading(false); // Ensure loading stops even if userData is null (after logout)
    }
  }, [userData]);



  // Logout function
  const handleLogout = async () => {
    try {
      await logOut(); // Use the logOut function from authService
      setIsLoggedin(false); // Update global state
      setUserData(null); // Reset user data
      setLoading(false); // Ensure loading is explicitly set to false
      toast.success("Logged out successfully!");
      navigate("/"); // Redirect to home page
    } catch (error) {
      toast.error(error.message || "Failed to log out.");
    }
  };

  return (
    <div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0 bg-white shadow-lg">
      <img
        src={assets.logo}
        alt="logo"
        className="w-28 sm:w-32 cursor-pointer"
        onClick={() => navigate("/")}
      />

      {/* Navigation Links */}
      <nav className="hidden sm:flex gap-6 text-gray-800 text-sm font-medium">
        <button onClick={() => navigate("/")} className="hover:text-indigo-600">
          Home
        </button>
        <button onClick={() => navigate("/gallery")} className="hover:text-indigo-600">
          Gallery
        </button>
        <button onClick={() => navigate("/donate")} className="hover:text-indigo-600">
          Donate
        </button>
        <button onClick={() => navigate("/about")} className="hover:text-indigo-600">
          About
        </button>
      </nav>

      {/* User Icon or Login Button */}
      {loading ? (
        <div className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-300 text-gray-700 animate-pulse">
          ...
        </div>
      ) : userData ? (
        <div className="w-8 h-8 flex justify-center items-center rounded-full bg-indigo-600 text-white relative group">
          {userData.name[0].toUpperCase()}
          <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-10">
            <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
              <li
                onClick={handleLogout}
                className="p-1 px-2 hover:bg-gray-200 cursor-pointer pr-10 whitespace-nowrap"
              >
                Log Out
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-indigo-600 hover:text-white transition-all"
        >
          Login 
        </button>
      )}
    </div>
  );
};

export default Navbar;
