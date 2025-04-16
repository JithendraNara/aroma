import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  Globe,
  Bookmark,
  CheckCircle,
  ChevronRight,
  Utensils,
  Share2,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import { getMealById } from "../../lib/mealdb";
import { useAuth } from "../../context/AuthContext";
import { saveRecipe, isRecipeSaved, unsaveRecipe } from "../../lib/supabase";
import Toast from "../../components/common/Toast";
import DefaultRecipeImage from "../../components/common/DefaultRecipeImage";

// Mock recipes to use when API fails or returns no results
const MOCK_RECIPES = [
  {
    idMeal: "m1",
    strMeal: "Vegetarian Pasta",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg",
    strCategory: "Pasta",
    strArea: "Italian",
    strTags: "vegetarian,pasta,quick",
    strInstructions:
      "1. Boil pasta according to package instructions. 2. Heat olive oil in a pan. 3. Add garlic and sauté until fragrant. 4. Add vegetables and cook until tender. 5. Mix pasta with the sauce and serve hot.",
  },
  {
    idMeal: "m2",
    strMeal: "Chicken Curry",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/swyeyq1511213062.jpg",
    strCategory: "Chicken",
    strArea: "Indian",
    strTags: "curry,meat,spicy,dinner",
    strInstructions:
      "1. Dice the chicken into bite-sized pieces. 2. Heat oil in a pan and add spices. 3. Add onion and sauté until translucent. 4. Add chicken and cook until browned. 5. Add curry sauce ingredients and simmer for 20 minutes. 6. Serve with rice.",
  },
  {
    idMeal: "m3",
    strMeal: "Beef Stew",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/stpuws1511191310.jpg",
    strCategory: "Beef",
    strArea: "French",
    strTags: "beef,meat,dinner,slow",
    strInstructions:
      "1. Cut beef into cubes. 2. Brown beef in a hot pot with oil. 3. Add vegetables and spices. 4. Pour in broth and bring to a simmer. 5. Cover and cook on low heat for at least an hour. 6. Serve hot with crusty bread.",
  },
];

const RecipeDetail = () => {
  const { recipeId } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [debugInfo, setDebugInfo] = useState({
    recipeId: recipeId,
    apiCallMade: false,
    apiResponse: null,
    errorDetails: null,
  });

  // Fetch recipe details
  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching recipe details for ID:", recipeId);
        setDebugInfo((prev) => ({ ...prev, recipeId: recipeId }));

        // Check if this is an AI recipe (id starts with 'ai-')
        if (recipeId && recipeId.startsWith("ai-")) {
          const aiRecipe = sessionStorage.getItem(`ai-recipe-${recipeId}`);
          if (aiRecipe) {
            setRecipe(JSON.parse(aiRecipe));
            setLoading(false);
            return;
          } else {
            setError("AI recipe not found in session.");
            setLoading(false);
            return;
          }
        }

        // Check if this is a mock recipe ID (starting with 'm')
        if (recipeId && recipeId.startsWith("m")) {
          console.log("Loading mock recipe");
          const mockRecipe = MOCK_RECIPES.find((r) => r.idMeal === recipeId);

          if (mockRecipe) {
            console.log("Mock recipe found:", mockRecipe);
            setRecipe(mockRecipe);

            if (user) {
              const isSaved = await isRecipeSaved(user.id, recipeId);
              setSaved(isSaved);
            }
          } else {
            console.error("Mock recipe not found for ID:", recipeId);
            setError("Recipe not found");
          }

          setLoading(false);
          return;
        }

        // If not a mock recipe, fetch from API
        setDebugInfo((prev) => ({ ...prev, apiCallMade: true }));

        const recipeData = await getMealById(recipeId);
        setDebugInfo((prev) => ({
          ...prev,
          apiResponse: recipeData ? "Data received" : "No data",
        }));

        if (!recipeData) {
          console.error("Recipe not found for ID:", recipeId);
          setError("Recipe not found");
          setDebugInfo((prev) => ({
            ...prev,
            errorDetails: "API returned no data for this ID",
          }));
          setLoading(false);

          // Fallback to mock recipes if we have a similar one
          const fallbackMock = MOCK_RECIPES.find((m) =>
            m.strMeal.toLowerCase().includes(recipeId.toLowerCase())
          );

          if (fallbackMock) {
            console.log("Using fallback mock recipe");
            setRecipe(fallbackMock);
            setError(null);
          }

          return;
        }

        console.log("Recipe data received:", recipeData);
        setRecipe(recipeData);

        // Check if recipe is saved
        if (user) {
          const isSaved = await isRecipeSaved(user.id, recipeId);
          setSaved(isSaved);
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Failed to load recipe details");
        setDebugInfo((prev) => ({ ...prev, errorDetails: err.message }));

        // Attempt to use a mock recipe as fallback
        const fallbackMock = MOCK_RECIPES[0]; // Just use the first mock recipe
        if (fallbackMock) {
          console.log("Using fallback mock recipe due to error");
          setRecipe(fallbackMock);
        }
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipeDetails();
    } else {
      setError("No recipe ID provided");
      setLoading(false);
    }
  }, [recipeId, user]);

  // Extract ingredients and measurements from recipe
  const getIngredients = () => {
    if (!recipe) return [];

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient,
          measure: measure || "",
        });
      }
    }

    return ingredients;
  };

  // Handle save/unsave recipe
  const handleSaveToggle = async () => {
    if (!user) return;

    try {
      if (saved) {
        // Unsave recipe
        const result = await unsaveRecipe(user.id, recipeId);

        if (result.success) {
          setSaved(false);
          setToastMessage("Recipe removed from your collection");
          setToastType("info");
          setShowToast(true);
        } else {
          setToastMessage(result.message || "Failed to remove recipe");
          setToastType("error");
          setShowToast(true);
        }
      } else {
        // Save recipe
        const recipeData = {
          id: recipeId,
          title: recipe.strMeal,
          image: recipe.strMealThumb,
          description: `${recipe.strArea || ""} ${
            recipe.strCategory || ""
          } recipe`,
          category: recipe.strCategory || "",
          time: "30 min", // Placeholder as API doesn't provide time
          difficulty: "Medium", // Placeholder
        };

        const result = await saveRecipe(user.id, recipeData);

        if (result.success) {
          setSaved(true);
          setToastMessage("Recipe saved to your collection!");
          setToastType("success");
          setShowToast(true);
        } else {
          setToastMessage(result.message || "Failed to save recipe");
          setToastType("error");
          setShowToast(true);
        }
      }
    } catch (err) {
      console.error("Error toggling save state:", err);
      setToastMessage("Error updating recipe");
      setToastType("error");
      setShowToast(true);
    }
  };

  // Format instructions into steps
  const formatInstructions = (instructions) => {
    if (!instructions) {
      console.warn("No instructions provided");
      return ["No instructions available for this recipe."];
    }

    console.log("Formatting instructions:", instructions);

    // Check if instructions are already an array
    if (Array.isArray(instructions)) {
      return instructions;
    }

    // Try to split by numbers first (e.g. "1. Do this")
    const numberedSteps = instructions.split(/\d+\.\s+/);
    if (numberedSteps.length > 1) {
      // Remove the first empty element if it exists
      return numberedSteps
        .filter((step) => step.trim())
        .map((step) => step.trim());
    }

    // Try splitting by line breaks
    if (instructions.includes("\n")) {
      return instructions
        .split("\n")
        .map((step) => step.trim())
        .filter((step) => step.length > 5);
    }

    // Otherwise split by periods, but be careful with abbreviations
    const steps = instructions
      .split(/\.(?=\s[A-Z])/)
      .map((step) => step.trim() + (step.endsWith(".") ? "" : "."))
      .filter((step) => step.length > 10); // Filter out very short segments

    return steps.length > 0 ? steps : [instructions]; // Return original if splitting failed
  };

  // Share recipe
  const handleShareRecipe = () => {
    if (navigator.share) {
      navigator
        .share({
          title: recipe.strMeal,
          text: `Check out this recipe for ${recipe.strMeal}!`,
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err);
        });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setToastMessage("Link copied to clipboard!");
      setToastType("success");
      setShowToast(true);
    }
  };

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
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/recipe-builder"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Recipes
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="text-red-500 mb-4 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-center">{error}</h2>
              <p className="text-gray-600 mb-6 text-center">
                We couldn't find the recipe you're looking for.
              </p>
              <div className="text-center">
                <Link to="/recipe-builder" className="btn-primary">
                  Discover More Recipes
                </Link>
              </div>

              {/* Debug info in development */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
                  <h3 className="font-bold mb-2">Debug Info:</h3>
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : recipe ? (
            <div>
              {/* Recipe Header */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                {recipe.strMealThumb ? (
                  <div className="relative h-64 md:h-80">
                    <img
                      src={recipe.strMealThumb}
                      alt={recipe.strMeal}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                            {recipe.strCategory || "Main"}
                          </span>
                          <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">
                            {recipe.strMeal}
                          </h1>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleShareRecipe}
                            className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                            title="Share recipe"
                          >
                            <Share2 size={20} />
                          </button>
                          <button
                            onClick={handleSaveToggle}
                            className={`p-2 bg-white rounded-full ${
                              saved
                                ? "text-primary-500"
                                : "text-gray-700 hover:text-primary-500"
                            }`}
                            title={saved ? "Remove from saved" : "Save recipe"}
                          >
                            <Bookmark
                              size={20}
                              fill={saved ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DefaultRecipeImage
                    title={recipe.strMeal}
                    className="h-64 md:h-80"
                  />
                )}

                {/* Recipe Meta Info */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                    {recipe.strArea && (
                      <div className="flex items-center">
                        <Globe size={18} className="mr-2 text-primary-500" />
                        <span>{recipe.strArea} Cuisine</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock size={18} className="mr-2 text-primary-500" />
                      <span>30 min</span>
                    </div>
                    <div className="flex items-center">
                      <Utensils size={18} className="mr-2 text-primary-500" />
                      <span>Medium</span>
                    </div>
                    {recipe.strTags && (
                      <div className="flex flex-wrap gap-1 ml-auto">
                        {recipe.strTags.split(",").map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 px-2 py-1 rounded-full text-xs"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Ingredients */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
                      Ingredients
                    </h2>
                    <ul className="space-y-3">
                      {getIngredients().map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle
                            size={18}
                            className="text-primary-500 mr-2 flex-shrink-0 mt-0.5"
                          />
                          <span>
                            <span className="font-medium">
                              {ingredient.measure}
                            </span>{" "}
                            {ingredient.name}
                          </span>
                        </li>
                      ))}
                      {getIngredients().length === 0 && (
                        <li className="text-gray-500">
                          No ingredients listed for this recipe.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Instructions */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
                      Instructions
                    </h2>

                    <div className="space-y-4">
                      {recipe.strInstructions ? (
                        formatInstructions(recipe.strInstructions).map(
                          (step, index) => (
                            <div key={index} className="flex">
                              <div className="mr-4 flex-shrink-0">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold">
                                  {index + 1}
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-700">{step}</p>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-gray-500">
                          No instructions available for this recipe.
                        </p>
                      )}
                    </div>

                    {/* YouTube Video */}
                    {recipe.strYoutube && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold mb-3">
                          Video Tutorial
                        </h3>
                        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                          <iframe
                            src={recipe.strYoutube.replace(
                              "watch?v=",
                              "embed/"
                            )}
                            title={`Video tutorial for ${recipe.strMeal}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-64 rounded-lg"
                          ></iframe>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading recipe...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecipeDetail;
