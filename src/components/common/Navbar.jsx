import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "../../lib/supabase";
import {
  ChefHat,
  Home,
  PlusCircle,
  Bookmark,
  User,
  LogOut,
  Menu,
  X,
  Cpu,
  Calendar,
} from "lucide-react";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    {
      name: "Recipe Builder",
      path: "/recipe-builder",
      icon: <PlusCircle size={20} />,
    },
    {
      name: "Saved Recipes",
      path: "/saved-recipes",
      icon: <Bookmark size={20} />,
    },
    {
      name: "AI Recipes",
      path: "/ai-recipes",
      icon: <Cpu size={20} />,
    },
    {
      name: "Plan Meals",
      path: "/plan-meals",
      icon: <Calendar size={20} />,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center">
            <ChefHat className="h-8 w-8 text-primary-500" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              The Aroma
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive(link.path)
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            <div className="relative ml-3">
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="user-menu-button"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                    {user?.email?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                </button>

                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-xs flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <LogOut size={12} className="mr-1" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive(link.path)
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-3">{link.icon}</span>
                {link.name}
              </Link>
            ))}

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="px-3 py-2 flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  {user?.email?.charAt(0).toUpperCase() || <User size={16} />}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.email?.split("@")[0] || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
              >
                <LogOut size={20} className="mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
