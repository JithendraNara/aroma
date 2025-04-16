// Update imports for Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "../../lib/supabase";
import {
  searchMealsByName,
  getAllIngredients,
  getMealById,
} from "../../lib/mealdb";
import { getSavedRecipes } from "../../lib/supabase";
import {
  ChefHat,
  Search,
  LogOut,
  User,
  Clock,
  Heart,
  PlusCircle,
  Bookmark,
  Coffee,
  Utensils,
  Calendar,
} from "lucide-react";

// Import components
import Navbar from "../../components/common/Navbar";
import DefaultRecipeImage from "../../components/common/DefaultRecipeImage";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [featuredRecipes, setFeaturedRecipes] = useState([]);

  // Mock featured recipes data
  const allFeaturedRecipes = [
    {
      id: "52772",
      title: "Teriyaki Chicken Casserole",
      image:
        "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
      time: "45 min",
      difficulty: "Medium",
      ingredients: ["Chicken", "Broccoli", "Rice", "Soy Sauce"],
    },
    {
      id: "52854",
      title: "Pancakes",
      image:
        "https://www.themealdb.com/images/media/meals/rwuyqx1511383174.jpg",
      time: "20 min",
      difficulty: "Easy",
      ingredients: ["Flour", "Eggs", "Milk", "Butter"],
    },
    {
      id: "52796",
      title: "Chicken Alfredo Primavera",
      image:
        "https://www.themealdb.com/images/media/meals/syqypv1486981727.jpg",
      time: "35 min",
      difficulty: "Medium",
      ingredients: ["Chicken", "Pasta", "Cream", "Vegetables"],
    },
    {
      id: "52846",
      title: "Vegetable Lasagna",
      image:
        "https://www.themealdb.com/images/media/meals/rvxxuy1468312893.jpg",
      time: "60 min",
      difficulty: "Medium",
      ingredients: ["Pasta Sheets", "Zucchini", "Eggplant", "Tomato Sauce"],
    },
    {
      id: "52765",
      title: "Spaghetti Bolognese",
      image:
        "https://www.themealdb.com/images/media/meals/sutysw1468247559.jpg",
      time: "40 min",
      difficulty: "Easy",
      ingredients: ["Spaghetti", "Beef", "Tomatoes", "Herbs"],
    },
    {
      id: "52871",
      title: "Spanish Tortilla",
      image:
        "https://www.themealdb.com/images/media/meals/quuxsx1511476154.jpg",
      time: "30 min",
      difficulty: "Medium",
      ingredients: ["Eggs", "Potatoes", "Onion", "Olive Oil"],
    },
  ];

  // Popular ingredients data (unchanged)
  const popularIngredients = [
    { name: "Chicken", count: 156 },
    { name: "Rice", count: 142 },
    { name: "Pasta", count: 128 },
    { name: "Tomatoes", count: 112 },
    { name: "Onions", count: 98 },
    { name: "Garlic", count: 87 },
    { name: "Beef", count: 76 },
    { name: "Eggs", count: 69 },
  ];

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchMealsByName(searchQuery);
      setSearchResults(results.slice(0, 6)); // Limit to 6 results
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Random selection of featured recipes
  const getRandomFeaturedRecipes = (recipes, count) => {
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Get random featured recipes
      setFeaturedRecipes(getRandomFeaturedRecipes(allFeaturedRecipes, 3));

      // Fetch saved recipes if user is logged in
      if (user) {
        try {
          const savedRecipesData = await getSavedRecipes(user.id);
          // Limit to 3 recipes for display
          setSavedRecipes(savedRecipesData.slice(0, 3));
        } catch (error) {
          console.error("Error fetching saved recipes:", error);
          setSavedRecipes([]);
        }
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.email?.split("@")[0] || "Chef"}!
              </h1>
              <p className="text-primary-100 mb-6">
                Let's create something delicious with what you have in your
                pantry.
              </p>

              <Link
                to="/recipe-builder"
                className="inline-flex items-center bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <PlusCircle size={20} className="mr-2" />
                Start Recipe Builder
              </Link>
            </div>
          </div>
        </section>

        {/* Search and Quick Actions */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Box */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Find Recipes</h2>
                <div className="flex">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="input-field pl-10"
                      placeholder="Search for recipes..."
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="ml-2 btn-primary"
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Search Results
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {searchResults.map((recipe) => (
                        <Link
                          to={`/recipe/${recipe.idMeal}`}
                          key={recipe.idMeal}
                          className="bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition-colors"
                        >
                          <img
                            src={recipe.strMealThumb}
                            alt={recipe.strMeal}
                            className="w-full h-24 object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {recipe.strMeal}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/recipe-builder"
                    className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <PlusCircle size={28} className="text-primary-500 mb-2" />
                    <span className="text-sm font-medium">New Recipe</span>
                  </Link>
                  <Link
                    to="/saved-recipes"
                    className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Bookmark size={28} className="text-secondary-500 mb-2" />
                    <span className="text-sm font-medium">Saved Recipes</span>
                  </Link>
                  <Link
                    to="/ai-recipes"
                    className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Utensils size={28} className="text-green-500 mb-2" />
                    <span className="text-sm font-medium">AI Recipes</span>
                  </Link>
                  <Link
                    to="/plan-meals"
                    className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Calendar size={28} className="text-purple-500 mb-2" />
                    <span className="text-sm font-medium">Meal Planner</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recipe Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Recipes */}
          <div className="lg:col-span-2">
            <section className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Featured Recipes</h2>
                <Link
                  to="/recipe-builder"
                  className="text-primary-600 hover:underline text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredRecipes.map((recipe) => (
                  <Link
                    to={`/recipe/${recipe.id}`}
                    key={recipe.id}
                    className="card group hover:shadow-lg transition-shadow"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2"></div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                        {recipe.title}
                      </h3>

                      <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {recipe.time}
                        </span>
                        <span>{recipe.difficulty}</span>
                      </div>

                      <div className="text-xs flex flex-wrap gap-1">
                        {recipe.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 rounded-full"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div>
            {/* Popular Ingredients */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-6">
                Popular Ingredients
              </h2>
              <div className="bg-white rounded-xl shadow-md p-4">
                <ul className="space-y-3">
                  {popularIngredients.map((ing, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center px-2 py-1.5 hover:bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-700">
                        {ing.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {ing.count} recipes
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Saved Recipes */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Saved Recipes</h2>
                <Link
                  to="/saved-recipes"
                  className="text-primary-600 hover:underline text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                {savedRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {savedRecipes.map((recipe) => (
                      <Link
                        to={`/recipe/${recipe.recipe_id || recipe.recipeId}`}
                        key={recipe.recipe_id || recipe.recipeId}
                        className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition-colors"
                      >
                        {recipe.image ? (
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Bookmark className="text-gray-400" size={16} />
                          </div>
                        )}
                        <span className="font-medium text-gray-800 line-clamp-1">
                          {recipe.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No saved recipes yet</p>
                    <Link
                      to="/recipe-builder"
                      className="text-primary-600 hover:underline text-sm block mt-2"
                    >
                      Discover New Recipes
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
