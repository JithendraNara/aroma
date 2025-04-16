import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import {
  Heart,
  Clock,
  Search,
  ArrowLeft,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getSavedRecipes, unsaveRecipe } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/common/Toast";
import DefaultRecipeImage from "../../components/common/DefaultRecipeImage";

const SavedRecipes = () => {
  const { user } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Fetch saved recipes from Supabase or local storage
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const recipes = await getSavedRecipes(user.id);
        setSavedRecipes(recipes);
      } catch (error) {
        console.error("Error fetching saved recipes:", error);
        setToastMessage(
          "Couldn't load your saved recipes. Please try again later."
        );
        setToastType("error");
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, [user]);

  // Handle removing a recipe from saved collection
  const handleRemoveRecipe = async (recipeId) => {
    if (!user) return;

    try {
      const result = await unsaveRecipe(user.id, recipeId);

      if (result.success) {
        // Update the local state
        setSavedRecipes(
          savedRecipes.filter(
            (recipe) =>
              (recipe.recipe_id ? recipe.recipe_id : recipe.recipeId) !==
              recipeId
          )
        );

        // Show success toast
        setToastMessage("Recipe removed from your collection");
        setToastType("success");
        setShowToast(true);
      } else {
        // Show error toast
        setToastMessage(result.message || "Failed to remove recipe");
        setToastType("error");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error removing recipe:", error);
      setToastMessage("An error occurred");
      setToastType("error");
      setShowToast(true);
    }
  };

  // Filter recipes based on search term
  const filteredRecipes = savedRecipes.filter((recipe) => {
    const title = recipe.title || "";
    const category = recipe.category || "";
    const searchTermLower = searchTerm.toLowerCase();

    return (
      title.toLowerCase().includes(searchTermLower) ||
      category.toLowerCase().includes(searchTermLower)
    );
  });

  // Normalize recipe ID field (might be recipe_id from DB or recipeId from local storage)
  const getRecipeId = (recipe) => recipe.recipe_id || recipe.recipeId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold">Saved Recipes</h1>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Recipes Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <div
                  key={getRecipeId(recipe)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    {recipe.image ? (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <DefaultRecipeImage title={recipe.title} />
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => handleRemoveRecipe(getRecipeId(recipe))}
                        className="p-1.5 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50"
                        title="Remove from saved recipes"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {recipe.category && (
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3">
                        <span className="text-xs font-medium text-white bg-primary-500 px-2 py-1 rounded-full">
                          {recipe.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {recipe.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      {recipe.time && (
                        <>
                          <Clock size={14} className="mr-1" />
                          {recipe.time}
                          <span className="mx-2">•</span>
                        </>
                      )}
                      <span>
                        Saved on{" "}
                        {new Date(recipe.saved_date).toLocaleDateString()}
                      </span>
                    </div>

                    {recipe.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    <Link
                      to={`/recipe/${getRecipeId(recipe)}`}
                      className="block w-full text-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                      View Recipe
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white p-8 rounded-xl shadow-md max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <AlertCircle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No saved recipes found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? `No recipes matching "${searchTerm}" in your saved collection.`
                    : "You haven't saved any recipes yet. Start exploring and save your favorites!"}
                </p>
                <Link
                  to="/recipe-builder"
                  className="btn-primary block w-full text-center"
                >
                  Discover Recipes
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SavedRecipes;
