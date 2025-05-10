import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext.jsx";
import { toast } from "react-toastify";
import { signUp, logIn, initializeRecaptcha } from "../firebase/authService";
import { database } from "../firebase/firebaseConfig";
import { auth } from "../firebase/firebaseConfig";
import Navbar from "../components/Navbar";
import { Eye, EyeOff } from "lucide-react";
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { get, ref, query, orderByChild, equalTo, update } from "firebase/database";
import { signInWithPhoneNumber } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedin } = useContext(AppContent);

  const [state, setState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    setTimeout(() => {
      initializeRecaptcha();
    }, 500);
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    console.log(mobile);
    console.log(mobile.type);

    try {
      if (state === "Sign Up") {
        const { userCredential, confirmationResult } = await signUp(name, email, password, mobile);
        setConfirmationResult(confirmationResult);
        setIsOtpSent(true);
        toast.success("OTP sent to your mobile! Verify to complete signup.");
        toast.success("Verification Email has sent to your email! Verify to complete signup.");
        
      } else {
        const userCredential = await logIn(email, password);
        const { user } = userCredential;

        toast.success("Logged in successfully!");
        setIsLoggedin(true);

        if (user.email === "careconnect69@gmail.com") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (newMobile) => {
    return '+' + newMobile
  }

  const resendOtpHandler = async () => {
    try {
      if (!mobile) {
        toast.error("Please enter a valid mobile number.");
        return;
      }

      setLoading(true);

      initializeRecaptcha();

      if (!window.recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized properly.");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Resending OTP to:", mobile);

      const newConfirmationResult = await signInWithPhoneNumber(auth, mobile, window.recaptchaVerifier);
      setConfirmationResult(newConfirmationResult);

      toast.success("OTP resent successfully!");
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpHandler = async () => {
    try {
      if (!confirmationResult) {
        toast.error("OTP verification failed. Try signing up again.");
        return;
      }

      const result = await confirmationResult.confirm(otp);

      if (!result.user) {
        toast.error("OTP verification failed. Please try again.");
        return;
      }

      const usersRef = ref(database, "users");
      const userQuery = query(usersRef, orderByChild("email"), equalTo(email));
      const snapshot = await get(userQuery);

      if (snapshot.exists()) {
        const userId = Object.keys(snapshot.val())[0];

        await update(ref(database, `users/${userId}`), {
          isMobileVerified: true,
          mobileUid: result.user.uid, // Add mobile UID to Firestore
        });

        toast.success("Mobile number verified! Signup complete.");
        setIsOtpSent(false);
        navigate("/");
      } else {
        toast.error("User not found. Cannot verify mobile.");
      }

    } catch (error) {
      console.error("OTP Verification Error:", error);
      toast.error("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 mt-10">
      <Navbar />
      <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96">
        <div id="recaptcha-container"></div>
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">
          {isOtpSent ? "Verify OTP" : state === "Sign Up" ? "Create Account" : "Login"}
        </h1>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        {isOtpSent ? (
          <>
            <p className="text-center text-gray-600 mb-4">Enter the OTP sent to your mobile.</p>
            <input
              type="text"
              placeholder="Enter OTP"
              className="mt-1 p-3 w-full border rounded-md shadow-sm"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button
              onClick={verifyOtpHandler}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-md mt-4 hover:bg-indigo-800"
            >
              Verify OTP
            </button>

            <p className="text-center text-gray-600 mt-3">
              Didn't receive an OTP?{" "}
              <span
                onClick={resendOtpHandler}
                className="text-indigo-500 font-medium cursor-pointer"
              >
                Resend OTP
              </span>
            </p>
          </>
        ) : (
          <form onSubmit={onSubmitHandler}>
            {state === "Sign Up" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="mt-1 p-3 w-full border rounded-md shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <PhoneInput
                    country={'lk'}
                    value={mobile}
                    onChange={(phone) => setMobile(formatPhone(phone))}
                    required
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="mt-1 p-3 w-full border rounded-md shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="mt-1 p-3 w-full border rounded-md shadow-sm pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {state === "Login" && (
              <p
                onClick={() => navigate("/reset-password")}
                className="text-indigo-500 text-sm text-right cursor-pointer mb-4"
              >
                Forgot password?
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 text-white rounded-md ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {loading ? "Processing..." : state}
            </button>
          </form>
        )}

        {isOtpSent ? (
          <p></p>
        ) : (
          state === "Sign Up" ? (
            <p className="text-center text-gray-600 mt-4">
              Already have an account?{" "}
              <span
                onClick={() => setState("Login")}
                className="text-indigo-500 font-medium cursor-pointer"
              >
                Login
              </span>
            </p>
          ) : (
            <p className="text-center text-gray-600 mt-4">
              Don&apos;t have an account?{" "}
              <span
                onClick={() => setState("Sign Up")}
                className="text-indigo-500 font-medium cursor-pointer"
              >
                Sign Up
              </span>
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default Login;