import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import {
  onAuthStateChange,
  logOut,
  signUp,
  logIn,
  sendVerificationEmail,
  fetchUserData, // Import getUserData from authService
} from "../firebase/authService";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);

  // Fetch User Data Using authService
  const getUserData = async (userId) => {
    try {
      const userData = await fetchUserData(userId); // Use authService's getUserData
      setUserData(userData); // Update userData state
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      toast.error(error.message || "Failed to fetch user data.");
      setUserData(null);
    }
  };

  // Track Authentication State
  const getAuthState = () => {
    onAuthStateChange(async (user) => {
      if (user) {
        setIsLoggedin(true);
        await getUserData(user.uid); // Fetch user data from Realtime Database
      } else {
        setIsLoggedin(false);
        setUserData(null);
      }
    });
  };

  // Sign Up Function
  const handleSignUp = async (email, password, name) => {
    try {
      const userCredential = await signUp(email, password);
      const { user } = userCredential;

      // Save user data to Realtime Database
      await fetchUserData(user.uid, {
        name,
        email,
        uid: user.uid,
        emailVerified: user.emailVerified,
      });

      toast.success("Account created successfully!");
      setIsLoggedin(true);
      await sendVerificationEmail(); // Send verification email
      await getUserData(user.uid); // Fetch and set user data
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Login Function
  const handleLogin = async (email, password) => {
    try {
      const userCredential = await logIn(email, password);
      const { user } = userCredential;
      toast.success("Logged in successfully!");
      setIsLoggedin(true);
      await getUserData(user.uid); // Fetch and set user data
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Logout Function
  const handleLogout = async () => {
    try {
      await logOut();
      setIsLoggedin(false);
      setUserData(null);
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Initialize Authentication State Listener
  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    isLoggedin,
    userData,
    setUserData,
    setIsLoggedin,
    handleSignUp,
    handleLogin,
    handleLogout,
    getUserData,
  };

  return <AppContent.Provider value={value}>{props.children}</AppContent.Provider>;
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
