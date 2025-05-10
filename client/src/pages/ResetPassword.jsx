import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { resetPassword } from "../firebase/authService"; // Import the resetPassword function
import { toast } from "react-toastify";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isEmailLoading, setEmailLoading] = useState(false);

  // Handle sending password reset email
  const onSubmitEmail = async (e) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      await resetPassword(email);
      toast.success("Password reset email sent successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 sm:px-0">
      <Navbar />
      <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">
          Reset Password
        </h1>
        <form onSubmit={onSubmitEmail}>
          <p className="text-center text-gray-600 mb-6">
            Enter your registered email address to receive a password reset link.
          </p>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="mt-1 p-3 w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2.5 text-white rounded-md ${
              isEmailLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            disabled={isEmailLoading}
          >
            {isEmailLoading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
