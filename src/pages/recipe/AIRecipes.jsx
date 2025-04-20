import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import {
  ArrowLeft,
  ChevronRight,
  Zap,
  Clock,
  Heart,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../../components/common/Toast";
import DefaultRecipeImage from "../../components/common/DefaultRecipeImage";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { searchMealsByName, searchMealsByIngredient, getMealById } from "../../lib/mealdb";

// Helper: Parse AI recipe text into title, ingredients, and instructions
function parseAIRecipe(aiText) {
  // Extract title
  const titleMatch = aiText.match(/^Title:\s*(.+)$/im) || aiText.match(/^(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : "AI Recipe";

  // Extract ingredients
  const ingredientsMatch = aiText.match(/Ingredients[:\-\n]*([\s\S]*?)(?:Instructions[:\-\n]|Steps[:\-\n]|\n\n|$)/i);
  let ingredients = [];
  if (ingredientsMatch) {
    ingredients = ingredientsMatch[1]
      .split(/\n|\r/)
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter((line) => line.length > 1 && !/^instructions?/i.test(line));
  }

  // Extract instructions
  const instructionsMatch = aiText.match(/(?:Instructions|Steps)[:\-\n]*([\s\S]*)/i);
  let instructions = "";
  if (instructionsMatch) {
    instructions = instructionsMatch[1].trim();
  } else {
    // Fallback: try to find after ingredients
    instructions = aiText.split(/Ingredients[:\-\n][\s\S]*?(?:Instructions[:\-\n]|Steps[:\-\n]|\n\n|$)/i)[1] || "";
    instructions = instructions.trim();
  }

  return { title, ingredients, instructions };
}

const AIRecipes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    dietaryPreference: "",
    mealType: "",
    cuisine: "",
    cookingTime: "",
    skillLevel: "",
    additionalInfo: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [savedRecipes, setSavedRecipes] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [exploreRecipe, setExploreRecipe] = useState(null);

  const generateImageWithXAI = async (prompt) => {
    try {
      const enhancedPrompt = `Professional food photography of ${prompt}. The dish is beautifully plated on an elegant ceramic plate or rustic wooden board, captured from a 45-degree angle or overhead perspective. The lighting is soft and natural, highlighting the textures and colors of the food. The background is intentionally blurred with warm, inviting tones. Garnishes and ingredients are artfully arranged, and there's a slight steam or moisture visible if the dish is hot. The image style is clean, modern, and appetizing, suitable for a high-end restaurant menu or food magazine.`;
      
      const response = await axios.post(
        "https://api.x.ai/v1/images/generations",
        {
          model: "grok-2-image",
          prompt: enhancedPrompt,
          n: 1,
          response_format: "url"
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Extract the URL and revised prompt from the response
      const imageUrl = response.data.data[0].url;
      const revisedPrompt = response.data.data[0].revised_prompt;
      console.log('Generated image with revised prompt:', revisedPrompt);
      
      return imageUrl;
    } catch (err) {
      console.error("Error generating image:", err);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      // Try to get the user's name from metadata, user_metadata, or fall back to email
      const userName = user.user_metadata?.full_name || 
                      user.user_metadata?.name ||
                      user.email?.split('@')[0] ||
                      'there';
      
      setChatMessages([
        {
          sender: "ai",
          text: `Hello ${userName}! Welcome to your AI Recipe Assistant. Ask me anything about recipes or let me know what ingredients you have!`,
        },
      ]);
    } else {
      setChatMessages([
        {
          sender: "ai",
          text: `Hello! Welcome to your AI Recipe Assistant. Ask me anything about recipes or let me know what ingredients you have!`,
        },
      ]);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences({
      ...preferences,
      [name]: value,
    });
  };

  const applyFilters = (recipes) => {
    if (!recipes || recipes.length === 0) return [];
    
    return recipes.filter(recipe => {
      // Dietary Preference Filter
      if (preferences.dietaryPreference) {
        const dietaryTags = (recipe.strTags || "").toLowerCase();
        const category = (recipe.strCategory || "").toLowerCase();
        
        switch (preferences.dietaryPreference.toLowerCase()) {
          case "vegetarian":
            if (["beef", "chicken", "pork", "lamb", "seafood", "fish"].some(meat => 
              category.includes(meat) || dietaryTags.includes(meat))) {
              return false;
            }
            break;
          case "vegan":
            if (["meat", "chicken", "beef", "pork", "fish", "egg", "milk", "cheese", "dairy"].some(item =>
              category.includes(item) || dietaryTags.includes(item))) {
              return false;
            }
            break;
          case "gluten-free":
            if (["wheat", "flour", "pasta", "bread"].some(item =>
              recipe.strInstructions?.toLowerCase().includes(item))) {
              return false;
            }
            break;
          // Add other dietary preference checks as needed
        }
      }

      // Meal Type Filter
      if (preferences.mealType && !recipe.strCategory?.toLowerCase().includes(preferences.mealType.toLowerCase())) {
        const mealTypeKeywords = {
          breakfast: ["breakfast", "morning", "brunch"],
          lunch: ["lunch", "sandwich", "salad"],
          dinner: ["dinner", "supper", "main course"],
          snack: ["snack", "appetizer", "side"],
          dessert: ["dessert", "sweet", "cake", "pie"]
        };
        
        const keywords = mealTypeKeywords[preferences.mealType.toLowerCase()] || [];
        if (!keywords.some(keyword => 
          recipe.strMeal?.toLowerCase().includes(keyword) ||
          recipe.strTags?.toLowerCase().includes(keyword))) {
          return false;
        }
      }

      // Cuisine Filter
      if (preferences.cuisine && 
          recipe.strArea?.toLowerCase() !== preferences.cuisine.toLowerCase() &&
          !recipe.strTags?.toLowerCase().includes(preferences.cuisine.toLowerCase())) {
        return false;
      }

      // Cooking Time Filter
      if (preferences.cookingTime) {
        const timeEstimate = estimateCookingTime(recipe);
        if (!timeEstimate.includes(preferences.cookingTime)) {
          return false;
        }
      }

      // Skill Level Filter
      if (preferences.skillLevel) {
        const difficulty = calculateDifficulty(recipe);
        if (difficulty.toLowerCase() !== preferences.skillLevel.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  };

  // Helper function to estimate cooking time
  const estimateCookingTime = (recipe) => {
    const instructions = recipe.strInstructions?.toLowerCase() || '';
    const ingredientCount = Object.keys(recipe)
      .filter(key => key.startsWith('strIngredient') && recipe[key])
      .length;

    if (instructions.includes('overnight') || instructions.includes('hours')) {
      return 'Over 60 minutes';
    } else if (instructions.includes('simmer') || instructions.includes('bake') || ingredientCount > 8) {
      return '30-60 minutes';
    } else if (instructions.includes('quick') || ingredientCount <= 5) {
      return '15-30 minutes';
    }
    return '15-30 minutes';
  };

  // Helper function to calculate difficulty
  const calculateDifficulty = (recipe) => {
    const ingredientCount = Object.keys(recipe)
      .filter(key => key.startsWith('strIngredient') && recipe[key])
      .length;
    const stepCount = recipe.strInstructions?.split(/\d+\./).length || 0;

    if (ingredientCount > 10 || stepCount > 8) return 'Advanced';
    if (ingredientCount > 6 || stepCount > 5) return 'Intermediate';
    return 'Beginner';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiRecipes([]);

    try {
      // First try to find real recipes
      let foundRecipes = [];
      
      // Search by multiple criteria
      const searchQueries = [
        preferences.cuisine,
        preferences.mealType,
        preferences.dietaryPreference,
        preferences.additionalInfo
      ].filter(Boolean);

      for (const query of searchQueries) {
        const results = await searchMealsByName(query);
        foundRecipes.push(...results);
      }

      // Remove duplicates
      foundRecipes = [...new Map(foundRecipes.map(r => [r.idMeal, r])).values()];

      // Apply filters
      foundRecipes = applyFilters(foundRecipes);

      if (foundRecipes.length > 0) {
        setAiRecipes(foundRecipes.slice(0, 5));
        setToastMessage("Found some recipes matching your preferences!");
        setToastType("success");
      } else {
        // Fallback to AI generation
        const axios = (await import("axios")).default;
        const prompt = `Generate 3 creative recipes based on these preferences: Dietary: ${preferences.dietaryPreference}, Meal: ${preferences.mealType}, Cuisine: ${preferences.cuisine}, Cooking Time: ${preferences.cookingTime}, Skill: ${preferences.skillLevel}, Additional: ${preferences.additionalInfo}.\n\nPlease format your response strictly as follows for each recipe:\nTitle: <Recipe Title>\nDescription: <Brief appetizing description>\nIngredients:\n- <ingredient 1>\n- <ingredient 2>\n...\nInstructions:\n1. <step 1>\n2. <step 2>\n...\nSeparate each recipe with \n---\n.`;
        
        const response = await axios.post(
          "https://api.x.ai/v1/chat/completions",
          {
            model: "grok-3-mini",
            messages: [
              { role: "system", content: "You are a helpful AI chef assistant. When asked for recipes, always return a list of 3 creative recipes in the strict format described by the user prompt." },
              { role: "user", content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const aiText = response.data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a recipe.";
        const aiRecipeBlocks = aiText.split(/\n---+\n/).map(block => block.trim()).filter(Boolean);
        let aiRecipeList = [];

        if (aiRecipeBlocks.length > 0) {
          aiRecipeList = await Promise.all(aiRecipeBlocks.map(async (block, idx) => {
            const parsed = parseAIRecipe(block);
            if (parsed.title && parsed.ingredients.length > 1 && parsed.instructions && parsed.instructions.length > 10) {
              // Generate image for the recipe
              const imageUrl = await generateImageWithXAI(`${parsed.title}, ${preferences.cuisine || ''} cuisine`);
              
              const aiRecipe = {
                idMeal: `ai-${Date.now()}-${idx}`,
                strMeal: parsed.title,
                strInstructions: parsed.instructions,
                strMealThumb: imageUrl,
                strCategory: preferences.mealType || "AI",
                strArea: preferences.cuisine || "AI Generated",
                strTags: preferences.dietaryPreference,
              };
              parsed.ingredients.slice(0, 20).forEach((ing, i) => {
                aiRecipe[`strIngredient${i + 1}`] = ing;
                aiRecipe[`strMeasure${i + 1}`] = "";
              });
              return aiRecipe;
            }
            return null;
          }));
        }

        // Filter out any null results
        aiRecipeList = aiRecipeList.filter(Boolean);

        if (aiRecipeList.length > 0) {
          setAiRecipes(aiRecipeList);
          setToastMessage("Here are some AI-generated recipes for you!");
          setToastType("success");
        } else {
          setAiRecipes([]);
          setToastMessage("Sorry, I couldn't generate any valid recipes. Please try again.");
          setToastType("error");
        }
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      setToastMessage("An error occurred while generating recipes");
      setToastType("error");
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  // Mock function to save recipe
  const handleSaveRecipe = (recipeId) => {
    // Toggle saved state
    setSavedRecipes({
      ...savedRecipes,
      [recipeId]: !savedRecipes[recipeId],
    });

    // Show toast
    const message = savedRecipes[recipeId]
      ? "Recipe removed from your saved collection"
      : "Recipe saved to your collection!";

    setToastMessage(message);
    setToastType(savedRecipes[recipeId] ? "info" : "success");
    setShowToast(true);
  };

  // xAI Chat Handler
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = { sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    setChatInput("");

    // 1. Extract all relevant ingredient keywords from user input
    const ingredientWords = [
      "eggs", "egg", "chicken", "beef", "fish", "rice", "potato", "onion", "tomato", "cheese", "milk", "bread", "pasta", "carrot", "spinach", "pepper", "mushroom", "garlic", "beans", "lentil", "tofu", "paneer", "shrimp", "lamb", "broccoli", "cauliflower", "corn", "peas", "avocado", "bacon", "sausage", "turkey", "duck", "salmon", "tuna", "apple", "banana", "orange", "lemon", "lime", "strawberry", "blueberry", "yogurt", "cream", "butter", "flour", "sugar", "honey", "oats", "coconut", "almond", "walnut", "cashew", "pistachio", "lettuce", "cabbage", "zucchini", "eggplant", "pumpkin", "sweet potato", "chickpea", "quinoa", "barley", "basil", "cilantro", "parsley", "mint", "rosemary", "thyme", "sage", "dill", "coriander", "mustard", "kale", "arugula", "rocket", "radish", "turnip", "celery", "leek", "scallion", "green onion", "chive", "artichoke", "asparagus", "beet", "brussels sprout", "cucumber", "date", "fig", "grape", "kiwi", "mango", "melon", "papaya", "peach", "pear", "pineapple", "plum", "pomegranate", "raspberry", "watermelon"
    ];
    const inputLower = chatInput.toLowerCase();
    const sortedWords = [...ingredientWords].sort((a, b) => b.length - a.length);
    const found = [];
    for (const word of sortedWords) {
      if (inputLower.includes(word) && !found.some(f => f.includes(word) || word.includes(f))) {
        found.push(word);
      }
    }

    // 2. Fetch MealDB results for all found ingredients (intersection logic)
    let mealDbResults = [];
    if (found.length > 0) {
      try {
        // Start with results for the first ingredient
        mealDbResults = await searchMealsByIngredient(found[0]);
        // For each additional ingredient, filter recipes to those that include it
        for (let i = 1; i < found.length; i++) {
          const nextResults = await searchMealsByIngredient(found[i]);
          const nextIds = new Set((nextResults || []).map(r => r.idMeal));
          mealDbResults = mealDbResults.filter(r => nextIds.has(r.idMeal));
        }
        // Optionally, fetch full details for the top results
        if (mealDbResults.length > 0 && mealDbResults[0].idMeal) {
          mealDbResults = await Promise.all(mealDbResults.slice(0, 5).map((r) => getMealById(r.idMeal)));
        }
      } catch (err) {
        // Ignore errors, fallback to AI
      }
    }
    // 3. Add MealDB results to chatMessages
    if (mealDbResults && mealDbResults.length > 0) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "mealdb",
          text: `Found ${mealDbResults.length} recipes in TheMealDB for \"${found.join(", ")}\"`,
          recipes: mealDbResults.slice(0, 5),
        },
      ]);
    } else if (found.length > 0) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "mealdb",
          text: `No recipes found in TheMealDB for \"${found.join(", ")}\"`,
          recipes: [],
        },
      ]);
    }

    // 4. Fetch AI results (xAI)
    try {
      const axios = (await import("axios")).default;
      const aiPrompt = found.length > 0
        ? `List 3 creative recipes using the following ingredients: ${found.join(", ")}. For each recipe, use this format:\nTitle: <Recipe Title>\nDescription: <Brief appetizing description>\nIngredients:\n- <ingredient 1>\n- <ingredient 2>\n...\nInstructions:\n1. <step 1>\n2. <step 2>\n...\nSeparate each recipe with \n---\n.`
        : chatInput;
      const response = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model: "grok-3-mini",
          messages: [
            { role: "system", content: "You are a helpful AI chef assistant. When asked for recipes, always return a list of 3 creative recipes in the strict format described by the user prompt." },
            { role: "user", content: aiPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const aiText = response.data.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer.";
      // Parse AI response into a list of recipes
      const aiRecipeBlocks = aiText.split(/\n---+\n/).map(block => block.trim()).filter(Boolean);
      let aiRecipeList = [];
      if (aiRecipeBlocks.length > 0 && found.length > 0) {
        aiRecipeList = await Promise.all(aiRecipeBlocks.map(async (block, idx) => {
          const parsed = parseAIRecipe(block);
          if (parsed.title && parsed.ingredients.length > 1 && parsed.instructions && parsed.instructions.length > 10) {
            // Generate image for the recipe
            const imageUrl = await generateImageWithXAI(parsed.title);
            
            const recipe = {
              idMeal: `ai-chat-${Date.now()}-${idx}`,
              strMeal: parsed.title,
              strInstructions: parsed.instructions,
              strMealThumb: imageUrl,
              strCategory: "AI Chat",
              strArea: "AI Generated",
              strTags: "AI,Chat",
            };
            parsed.ingredients.slice(0, 20).forEach((ing, i) => {
              recipe[`strIngredient${i + 1}`] = ing;
              recipe[`strMeasure${i + 1}`] = "";
            });
            return recipe;
          }
          return null;
        }));

        // Filter out any null results
        aiRecipeList = aiRecipeList.filter(Boolean);
      }

      // If no recipes found or no ingredients, treat as general chat
      if (aiRecipeList.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: aiText }
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai-list", recipes: aiRecipeList, text: `Here are some creative AI recipes${found.length > 0 ? ` for \"${found.join(", ")}\"` : ""}` }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, there was an error contacting the AI." },
      ]);
      // Log error details for debugging
      console.error("AI chat error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper: Check if a chat message is a recipe (has Ingredients and Instructions)
  function isRecipeText(text) {
    return /ingredients[:\-\n]/i.test(text) && /(instructions|steps)[:\-\n]/i.test(text);
  }

  // Helper: Convert parsed recipe to RecipeDetail format
  function aiChatToRecipeDetail(aiText) {
    const parsed = parseAIRecipe(aiText);
    const recipe = {
      idMeal: `ai-chat-${Date.now()}`,
      strMeal: parsed.title,
      strInstructions: parsed.instructions,
      strMealThumb: null,
      strCategory: "AI Chat",
      strArea: "AI Generated",
      strTags: "AI,Chat",
    };
    parsed.ingredients.slice(0, 20).forEach((ing, idx) => {
      recipe[`strIngredient${idx + 1}`] = ing;
      recipe[`strMeasure${idx + 1}`] = "";
    });
    return recipe;
  }

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
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link
              to="/dashboard"
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">AI Recipe Recommendations</h1>
          </div>

          {/* AI Recipe Generator Form */}
          <section className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center mb-4 text-primary-600">
              <Sparkles className="mr-2" size={24} />
              <h2 className="text-xl font-semibold">
                Personalized Recipe Generator
              </h2>
            </div>

            <p className="text-gray-600 mb-6">
              Tell us your preferences, and our AI will suggest personalized
              recipes just for you!
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary Preference
                  </label>
                  <select
                    name="dietaryPreference"
                    value={preferences.dietaryPreference}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                    <option value="Dairy-Free">Dairy-Free</option>
                    <option value="Keto">Keto</option>
                    <option value="Low-Carb">Low-Carb</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    name="mealType"
                    value={preferences.mealType}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine
                  </label>
                  <select
                    name="cuisine"
                    value={preferences.cuisine}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Italian">Italian</option>
                    <option value="Asian">Asian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Indian">Indian</option>
                    <option value="American">American</option>
                    <option value="Middle Eastern">Middle Eastern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cooking Time
                  </label>
                  <select
                    name="cookingTime"
                    value={preferences.cookingTime}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Under 15 minutes">Under 15 minutes</option>
                    <option value="15-30 minutes">15-30 minutes</option>
                    <option value="30-60 minutes">30-60 minutes</option>
                    <option value="Over 60 minutes">Over 60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Level
                  </label>
                  <select
                    name="skillLevel"
                    value={preferences.skillLevel}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Any</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <input
                    type="text"
                    name="additionalInfo"
                    value={preferences.additionalInfo}
                    onChange={handleInputChange}
                    placeholder="e.g., specific ingredients, occasions, etc."
                    className="input-field"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"></span>
                    Generating Recipes...
                  </>
                ) : (
                  <>
                    <Zap size={18} className="mr-2" />
                    Generate Personalized Recipes
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Results Section */}
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">AI Chef at Work</h3>
              <p className="text-gray-600">
                Our AI is creating personalized recipes based on your
                preferences...
              </p>
            </div>
          ) : aiRecipes.length > 0 ? (
            <section>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  Your Personalized Recipes
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiRecipes.map((recipe) => (
                  <div
                    key={recipe.idMeal}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="relative overflow-hidden">
                      {recipe.strMealThumb ? (
                        <img
                          src={recipe.strMealThumb}
                          alt={recipe.strMeal}
                          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <DefaultRecipeImage title={recipe.strMeal} />
                      )}
                      <button
                        className={`absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white ${
                          savedRecipes[recipe.idMeal]
                            ? "text-red-500"
                            : "text-gray-500 hover:text-red-500"
                        } transition-colors`}
                        onClick={() => handleSaveRecipe(recipe.idMeal)}
                      >
                        <Heart
                          size={18}
                          fill={
                            savedRecipes[recipe.idMeal] ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                        {recipe.strMeal}
                      </h3>

                      <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {preferences.cookingTime || "30 min"}
                        </span>
                        <span>{preferences.skillLevel || "Medium"}</span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {recipe.strCategory}
                      </p>

                      <div className="text-xs flex flex-wrap gap-1 mb-4">
                        {Array.from({ length: 20 }, (_, idx) => recipe[`strIngredient${idx + 1}`])
                          .filter(Boolean)
                          .map((ing, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 rounded-full"
                            >
                              {ing}
                            </span>
                          ))}
                      </div>

                      {recipe.strInstructions && (
                        <div className="text-sm text-gray-600 mb-3">
                          <h4 className="font-semibold">Instructions:</h4>
                          <p>{recipe.strInstructions}</p>
                        </div>
                      )}

                      <button
                        className="block w-full text-center btn-primary mt-2"
                        onClick={() => {
                          sessionStorage.setItem(`ai-recipe-${recipe.idMeal}`, JSON.stringify(recipe));
                          navigate(`/recipe/${recipe.idMeal}`);
                        }}
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Chat/Q&A Section */}
          <section className="bg-white rounded-xl shadow-md p-6 mb-8 mt-8">
            <div className="flex items-center mb-4 text-primary-600">
              <Sparkles className="mr-2" size={24} />
              <h2 className="text-xl font-semibold">Recipe Q&amp;A (AI Chat)</h2>
            </div>
            <div className="h-64 overflow-y-auto bg-gray-50 rounded p-3 mb-4 border border-gray-200">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-center mt-20">Ask anything about recipes or cooking!</div>
              ) : (
                chatMessages.map((msg, idx) => {
                  if (msg.sender === "ai-list") {
                    return (
                      <div key={idx} className="mb-2">
                        <div className="px-3 py-2 rounded-lg bg-green-50 text-green-900 max-w-xl">
                          {msg.text && (
                            <div className="border-b pb-2 mb-2 flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{msg.text}</div>
                              </div>
                            </div>
                          )}
                          {msg.recipes && msg.recipes.length > 0 && (
                            <ul className="space-y-2">
                              {msg.recipes
                                .filter(r => r.strMeal && r.strInstructions && r.strInstructions.length > 20)
                                .map((r) => (
                                  <li key={r.idMeal} className="border-b last:border-b-0 pb-2">
                                    <div className="flex items-center gap-2">
                                      {r.strMealThumb ? (
                                        <img src={r.strMealThumb} alt={r.strMeal} className="w-10 h-10 object-cover rounded" />
                                      ) : (
                                        <DefaultRecipeImage title={r.strMeal} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{r.strMeal}</div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {Array.from({ length: 2 }, (_, i) => r[`strIngredient${i + 1}`])
                                            .filter(Boolean)
                                            .join(", ")}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                          {r.strInstructions ? r.strInstructions.split(/\n|\d+\.\s+/).filter(Boolean)[0] : ""}
                                        </div>
                                      </div>
                                      <button
                                        className="ml-auto btn-primary btn-xs"
                                        onClick={() => {
                                          sessionStorage.setItem(`ai-recipe-${r.idMeal}`, JSON.stringify(r));
                                          navigate(`/recipe/${r.idMeal}`);
                                        }}
                                      >
                                        Explore
                                      </button>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (msg.sender === "mealdb") {
                    return (
                      <div key={idx} className="mb-2">
                        <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-900 max-w-xl">
                          {msg.text && (
                            <div className="border-b pb-2 mb-2 flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{msg.text}</div>
                              </div>
                            </div>
                          )}
                          {msg.recipes && msg.recipes.length > 0 && (
                            <ul className="space-y-2">
                              {msg.recipes.map((r) => (
                                <li key={r.idMeal} className="border-b last:border-b-0 pb-2">
                                  <div className="flex items-center gap-2">
                                    {r.strMealThumb ? (
                                      <img src={r.strMealThumb} alt={r.strMeal} className="w-10 h-10 object-cover rounded" />
                                    ) : (
                                      <DefaultRecipeImage title={r.strMeal} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{r.strMeal}</div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {Array.from({ length: 2 }, (_, i) => r[`strIngredient${i + 1}`])
                                          .filter(Boolean)
                                          .join(", ")}
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">
                                        {r.strInstructions ? r.strInstructions.split(/\n|\d+\.\s+/).filter(Boolean)[0] : ""}
                                      </div>
                                    </div>
                                    <button
                                      className="ml-auto btn-primary btn-xs"
                                      onClick={() => navigate(`/recipe/${r.idMeal}`)}
                                    >
                                      Explore
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.sender === "user" ? "bg-primary-100 text-primary-800" : "bg-gray-200 text-gray-800"}`}>
                        {msg.text}
                        {msg.sender === "ai" && isRecipeText(msg.text) && (
                          <button
                            className="block mt-2 text-xs text-primary-600 underline hover:text-primary-800"
                            onClick={() => setExploreRecipe(aiChatToRecipeDetail(msg.text))}
                          >
                            Explore Recipe
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {chatLoading && (
                <div className="text-gray-400 text-center">AI is typing...</div>
              )}
            </div>
            {/* Chat input and send button always visible */}
            <form onSubmit={handleChatSubmit} className="flex gap-2 mt-2">
              <input
                type="text"
                className="input-field flex-1 border border-primary-300"
                placeholder="Ask a question about recipes..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                style={{ minWidth: 0 }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={chatLoading || !chatInput.trim()}
              >
                Send
              </button>
            </form>
            {/* Modal for Explore Recipe */}
            {exploreRecipe && (
              <Modal onClose={() => setExploreRecipe(null)}>
                <div className="max-w-2xl mx-auto p-4">
                  <h2 className="text-2xl font-bold mb-4">{exploreRecipe.strMeal}</h2>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Ingredients</h3>
                    <ul className="list-disc ml-6">
                      {Array.from({ length: 20 }, (_, idx) => exploreRecipe[`strIngredient${idx + 1}`])
                        .filter(Boolean)
                        .map((ing, idx) => (
                          <li key={idx}>{ing}</li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <ol className="list-decimal ml-6">
                      {exploreRecipe.strInstructions
                        ? exploreRecipe.strInstructions.split(/\n|\d+\.\s+/).filter(Boolean).map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))
                        : <li>No instructions available.</li>}
                    </ol>
                  </div>
                  <button
                    className="mt-6 btn-primary w-full"
                    onClick={() => setExploreRecipe(null)}
                  >
                    Close
                  </button>
                </div>
              </Modal>
            )}
          </section>

          {/* Helper Tips */}
          <section className="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <AlertCircle size={20} className="text-primary-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-primary-700 mb-2">
                  AI Recipe Tips
                </h3>
                <ul className="text-sm text-primary-800 space-y-2">
                  <li className="flex items-start">
                    <ChevronRight
                      size={16}
                      className="mr-1 flex-shrink-0 mt-0.5"
                    />
                    <span>
                      The more preferences you provide, the more personalized
                      your recipes will be.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight
                      size={16}
                      className="mr-1 flex-shrink-0 mt-0.5"
                    />
                    <span>
                      Use the additional information field to specify
                      ingredients you have on hand or dietary restrictions.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight
                      size={16}
                      className="mr-1 flex-shrink-0 mt-0.5"
                    />
                    <span>
                      Save your favorite AI recipes to access them later in your
                      Saved Recipes collection.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AIRecipes;
