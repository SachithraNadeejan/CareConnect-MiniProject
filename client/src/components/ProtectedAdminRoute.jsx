import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const ProtectedAdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🚀 Loading state to wait for Firebase

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Stop loading after checking auth
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // 🚀 Show loading while checking authentication state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-semibold text-gray-700">
        Checking access...
      </div>
    );
  }

  // 🚀 Redirect to Home if not an admin
  return user && user.email === "careconnect69@gmail.com" ? children : <Navigate to="/" />;
};

export default ProtectedAdminRoute;

