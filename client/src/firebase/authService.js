import { ref, set, get, update } from "firebase/database";
import { auth, database } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "firebase/auth";

export const initializeRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: (response) => {
        console.log("ReCAPTCHA verified successfully!");
      },
      "expired-callback": () => {
        console.log("ReCAPTCHA expired. Resetting...");
        window.recaptchaVerifier = null;
      },
    });
  }
};

// Sign up a new user and send verification email
export const signUp = async (name, email, password, mobile) => {
  try {
    initializeRecaptcha();

    if (!window.recaptchaVerifier) {
      throw new Error("reCAPTCHA not initialized properly.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Sending OTP to:", mobile);

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send OTP to the provided mobile number
    const confirmationResult = await signInWithPhoneNumber(auth, mobile, window.recaptchaVerifier);

    // Send email verification
    await sendEmailVerification(user);
    console.log("Verification email sent!");

    // Store user data in Firebase Database
    await set(ref(database, `users/${user.uid}`), {
      name,
      email,
      mobile,
      uid: user.uid,
      isMobileVerified: false,
    });

    return { userCredential, confirmationResult };
  } catch (error) {
    console.error("Error signing up:", error.message);
    const errorMessages = {
      "auth/email-already-in-use": "This email is already in use.",
      "auth/user-not-found": "No user found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-email": "Invalid email format. Please enter a valid email.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many failed login attempts. Please try again later.",
    };

    throw new Error(errorMessages[error.code] || error.message || "An unknown error occurred.");
  }
};

export const logIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error("Your email is not verified. Please check your inbox.");
    }

    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists() || !snapshot.val().isMobileVerified) {
      await signOut(auth);
      throw new Error("Your mobile number is not verified. Please verify it first.");
    }
    return userCredential;
  } catch (error) {
    console.error("Error logging in:", error.message);
    const errorMessages = {
      "auth/email-already-in-use": "This email is already in use.",
      "auth/user-not-found": "No user found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-email": "Invalid email format. Please enter a valid email.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many failed login attempts. Please try again later.",
    };

    throw new Error(errorMessages[error.code] || error.message || "An unknown error occurred.");
  }
};

export const fetchUserData = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    throw new Error(error.message || "Failed to fetch user data.");
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    console.log("User logged out successfully");
  } catch (error) {
    console.error("Error logging out:", error.message);
    throw new Error(error.message);
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully");
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    throw new Error(error.message);
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const updateUserProfile = async (user, profile) => {
  try {
    await updateProfile(user, profile);
    console.log("User profile updated successfully");
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    throw new Error(error.message);
  }
};

export const sendVerificationEmail = async () => {
  try {
    if (!auth.currentUser) throw new Error("No user is logged in.");

    if (!auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
      console.log("Verification email sent!");
      return "Verification email sent! Please check your inbox.";
    } else {
      return "Your email is already verified.";
    }
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    throw new Error(error.message || "Failed to send verification email.");
  }
};

export const setAuthPersistence = async (mode = "local") => {
  try {
    const persistenceMode =
      mode === "session" ? browserSessionPersistence : browserLocalPersistence;

    await setPersistence(auth, persistenceMode);
    console.log(`Authentication persistence set to ${mode}`);
  } catch (error) {
    console.error("Error setting auth persistence:", error.message);
    throw new Error(error.message);
  }
};

const errorMessages = {
  "auth/email-already-in-use": "This email is already in use.",
  "auth/weak-password": "Password should be at least 6 characters long.",
  "auth/user-not-found": "No user found with this email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
};

const getErrorMessage = (errorCode) => {
  return errorMessages[errorCode] || "An unknown error occurred.";
};