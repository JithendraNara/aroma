import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "../../lib/supabase";
import { ChefHat, User, Mail, Lock, AlertCircle } from "lucide-react";
import Toast from "../../components/common/Toast";
import { useAuth } from "../../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const navigate = useNavigate();
  const { setIsNewRegistration } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log("Starting signup process");

      // Pass the fullName to the signUp function
      await signUp(email, password, fullName);

      console.log("Signup successful, setting success state");
      setSuccess(true);

      // Mark this as a new registration in the auth context
      setIsNewRegistration(true);

      // Show toast notification
      setToastMessage("Account created successfully!");
      setToastType("success");
      setShowToast(true);

      // After 2 seconds, redirect to login with registered flag
      setTimeout(() => {
        console.log("Redirecting to login page after signup");
        navigate("/login?registered=true");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);

      // Handle specific Supabase error messages
      if (
        (err.message && err.message.includes("already registered")) ||
        (err.message && err.message.includes("already exists"))
      ) {
        setError("This email is already registered. Please log in instead.");
      } else if (
        (err.message && err.message.includes("invalid")) ||
        (err.message && err.message.includes("valid email"))
      ) {
        setError("Please enter a valid email address.");
      } else if (err.message && err.message.includes("password")) {
        setError("Password error: " + err.message);
      } else {
        setError("Failed to sign up. Please try again later.");
      }

      // Customize toast message based on error
      let toastMsg = "Failed to create account. ";
      if (err.message) {
        // Clean up technical error messages for user display
        if (
          err.message.includes("already registered") ||
          err.message.includes("already exists")
        ) {
          toastMsg += "This email is already registered.";
        } else if (
          err.message.includes("invalid") ||
          err.message.includes("valid email")
        ) {
          toastMsg += "Please check your email format.";
        } else {
          toastMsg += "Please try again.";
        }
      }

      setToastMessage(toastMsg);
      setToastType("error");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      {/* Left Side - Welcome Image (similar to login) */}
      <div className="hidden md:flex md:w-1/2 bg-primary-500 text-white p-10 items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <ChefHat size={80} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Join The Aroma</h1>
          <p className="text-xl opacity-90">
            Create your account today and start discovering recipes based on
            what's already in your kitchen.
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="md:hidden text-center mb-10">
            <ChefHat size={60} className="mx-auto text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900">The Aroma</h1>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create an account
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Account created successfully! Redirecting to login...
                </span>
              </div>
            )}

            <form onSubmit={handleSignup}>
              <div className="mb-4">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="Enter Your email"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Creating account...
                  </>
                ) : (
                  "Sign up"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
