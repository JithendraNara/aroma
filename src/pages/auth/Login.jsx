import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signIn } from "../../lib/supabase";
import { ChefHat, Mail, Lock, AlertCircle } from "lucide-react";
import Toast from "../../components/common/Toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from signup page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const registered = params.get("registered");

    if (registered === "true") {
      setToastMessage("Account created successfully! Please log in.");
      setToastType("success");
      setShowToast(true);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      setToastMessage("Login successful!");
      setToastType("success");
      setShowToast(true);

      // Short delay before redirecting to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");

      setToastMessage("Login failed. Please check your credentials.");
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
      {/* Left Side - Welcome Image */}
      <div className="hidden md:flex md:w-1/2 bg-primary-500 text-white p-10 items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <ChefHat size={80} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Welcome to The Aroma</h1>
          <p className="text-xl opacity-90">
            Your personal ingredient-based recipe builder. Transform your pantry
            into delightful meals.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="md:hidden text-center mb-10">
            <ChefHat size={60} className="mx-auto text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900">The Aroma</h1>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Log in to your account
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
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
                    placeholder="Enter your email"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary-600 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
