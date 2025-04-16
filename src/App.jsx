import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/dashboard/Dashboard";
import RecipeBuilder from "./pages/recipe/Builder";
import SavedRecipes from "./pages/recipe/SavedRecipes";
import AIRecipes from "./pages/recipe/AIRecipes";
import RecipeDetail from "./pages/recipe/RecipeDetail";
import PlanMeals from "./pages/planner/PlanMeals";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If there's no user and we're not loading, don't render children
  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return children;
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading, isNewRegistration } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading, user exists, and not a new registration, redirect to dashboard
    if (!loading && user && !isNewRegistration) {
      navigate("/dashboard");
    }
  }, [loading, user, isNewRegistration, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If there's a user and not a new registration, don't render children
  if (user && !isNewRegistration) {
    return null; // Will be redirected by the useEffect
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipe-builder"
        element={
          <ProtectedRoute>
            <RecipeBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved-recipes"
        element={
          <ProtectedRoute>
            <SavedRecipes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-recipes"
        element={
          <ProtectedRoute>
            <AIRecipes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan-meals"
        element={
          <ProtectedRoute>
            <PlanMeals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipe/:recipeId"
        element={
          <ProtectedRoute>
            <RecipeDetail />
          </ProtectedRoute>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
