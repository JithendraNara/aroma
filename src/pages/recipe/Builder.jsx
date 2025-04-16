import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  X,
  Search,
  Filter,
  Clock,
  ChevronDown,
  Heart,
  Info,
  Loader,
  Bookmark,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import {
  searchByMultipleIngredients,
  getAllIngredients,
  searchMealsByName,
  getMealById,
} from "../../lib/mealdb";
import { useAuth } from "../../context/AuthContext";
import { saveRecipe, isRecipeSaved, unsaveRecipe } from "../../lib/supabase";
import Toast from "../../components/common/Toast";
import DefaultRecipeImage from "../../components/common/DefaultRecipeImage";
import axios from "axios";

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
      "1. Cook pasta according to package instructions. 2. In a large pan, heat olive oil and sauté garlic until fragrant. 3. Add diced tomatoes, bell peppers, and zucchini. Cook until vegetables are tender. 4. Drain pasta and add to the vegetables. 5. Stir in fresh basil and grated parmesan cheese. 6. Season with salt and pepper to taste. 7. Serve hot with additional cheese if desired.",
    strIngredient1: "Pasta",
    strIngredient2: "Olive Oil",
    strIngredient3: "Garlic",
    strIngredient4: "Tomatoes",
    strIngredient5: "Bell Peppers",
    strIngredient6: "Zucchini",
    strIngredient7: "Fresh Basil",
    strIngredient8: "Parmesan Cheese",
    strIngredient9: "Salt",
    strIngredient10: "Pepper",
    strMeasure1: "250g",
    strMeasure2: "2 tbsp",
    strMeasure3: "2 cloves",
    strMeasure4: "3 medium",
    strMeasure5: "1 red, 1 yellow",
    strMeasure6: "1 medium",
    strMeasure7: "handful",
    strMeasure8: "1/2 cup",
    strMeasure9: "to taste",
    strMeasure10: "to taste",
  },

  {
    idMeal: "m4",
    strMeal: "Vegan Breakfast Bowl",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/vwwspt1487394060.jpg",
    strCategory: "Breakfast",
    strArea: "American",
    strTags: "vegan,breakfast,healthy,quick",
    strInstructions:
      "1. Cook quinoa according to package instructions and let cool. 2. Dice avocado, tomatoes, and cucumber. 3. Drain and rinse chickpeas. 4. In a small bowl, mix olive oil, lemon juice, salt, and pepper for the dressing. 5. In serving bowls, arrange quinoa, avocado, tomatoes, cucumber, and chickpeas. 6. Drizzle with dressing and sprinkle with fresh herbs. 7. Top with a sprinkle of nutritional yeast for a cheesy flavor.",
    strIngredient1: "Quinoa",
    strIngredient2: "Avocado",
    strIngredient3: "Tomatoes",
    strIngredient4: "Cucumber",
    strIngredient5: "Chickpeas",
    strIngredient6: "Olive Oil",
    strIngredient7: "Lemon Juice",
    strIngredient8: "Salt",
    strIngredient9: "Pepper",
    strIngredient10: "Fresh Herbs",
    strIngredient11: "Nutritional Yeast",
    strMeasure1: "1 cup",
    strMeasure2: "1",
    strMeasure3: "1 cup cherry",
    strMeasure4: "1/2",
    strMeasure5: "1 cup",
    strMeasure6: "2 tbsp",
    strMeasure7: "1 tbsp",
    strMeasure8: "to taste",
    strMeasure9: "to taste",
    strMeasure10: "handful",
    strMeasure11: "1 tbsp",
  },
  {
    idMeal: "m5",
    strMeal: "Chocolate Cake",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/qxutws1486978099.jpg",
    strCategory: "Dessert",
    strArea: "International",
    strTags: "dessert,chocolate,sweet",
    strInstructions:
      "1. Preheat oven to 350°F (175°C). Grease and flour two 9-inch round cake pans. 2. In a large bowl, mix flour, sugar, cocoa powder, baking soda, and salt. 3. Add eggs, milk, oil, and vanilla. Beat for 2 minutes. 4. Stir in boiling water (batter will be thin). 5. Pour into prepared pans. 6. Bake for 30-35 minutes or until a toothpick inserted comes out clean. 7. Cool in pans for 10 minutes, then remove to wire racks to cool completely. 8. For frosting, cream butter until smooth. 9. Gradually add cocoa and powdered sugar, alternating with milk. 10. Add vanilla and beat until spreading consistency. 11. Spread frosting between layers and on top and sides of cake.",
    strIngredient1: "All-purpose Flour",
    strIngredient2: "Sugar",
    strIngredient3: "Cocoa Powder",
    strIngredient4: "Baking Soda",
    strIngredient5: "Salt",
    strIngredient6: "Eggs",
    strIngredient7: "Milk",
    strIngredient8: "Vegetable Oil",
    strIngredient9: "Vanilla Extract",
    strIngredient10: "Boiling Water",
    strIngredient11: "Butter",
    strIngredient12: "Cocoa Powder",
    strIngredient13: "Powdered Sugar",
    strIngredient14: "Milk",
    strIngredient15: "Vanilla Extract",
    strMeasure1: "2 cups",
    strMeasure2: "2 cups",
    strMeasure3: "3/4 cup",
    strMeasure4: "2 tsp",
    strMeasure5: "1 tsp",
    strMeasure6: "2",
    strMeasure7: "1 cup",
    strMeasure8: "1/2 cup",
    strMeasure9: "2 tsp",
    strMeasure10: "1 cup",
    strMeasure11: "1/2 cup",
    strMeasure12: "1/3 cup",
    strMeasure13: "3 cups",
    strMeasure14: "1/3 cup",
    strMeasure15: "1 tsp",
  },
  {
    idMeal: "m6",
    strMeal: "Gluten-Free Pizza",
    strCategory: "Pizza",
    strArea: "Italian",
    strTags: "gluten-free,dinner,quick",
    strInstructions:
      "1. Preheat oven to 425°F (220°C). 2. In a large bowl, mix gluten-free flour, xanthan gum, salt, and yeast. 3. Add warm water, olive oil, and honey. Mix until dough forms. 4. On a gluten-free floured surface, knead dough for 5 minutes. 5. Roll dough into a circle and place on a pizza pan. 6. Spread pizza sauce over the dough. 7. Top with cheese and desired toppings. 8. Bake for 15-20 minutes until crust is golden and cheese is bubbly. 9. Let cool for 5 minutes before slicing.",
    strIngredient1: "Gluten-Free Flour",
    strIngredient2: "Xanthan Gum",
    strIngredient3: "Salt",
    strIngredient4: "Active Dry Yeast",
    strIngredient5: "Warm Water",
    strIngredient6: "Olive Oil",
    strIngredient7: "Honey",
    strIngredient8: "Pizza Sauce",
    strIngredient9: "Mozzarella Cheese",
    strIngredient10: "Toppings",
    strMeasure1: "2 cups",
    strMeasure2: "1 tsp",
    strMeasure3: "1 tsp",
    strMeasure4: "1 package",
    strMeasure5: "3/4 cup",
    strMeasure6: "2 tbsp",
    strMeasure7: "1 tbsp",
    strMeasure8: "1/2 cup",
    strMeasure9: "2 cups",
    strMeasure10: "as desired",
  },
  {
    idMeal: "m7",
    strMeal: "Vegetarian Chili",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
    strCategory: "Vegetarian",
    strArea: "Mexican",
    strTags: "vegetarian,beans,spicy,dinner",
    strInstructions:
      "1. Heat oil in a large pot over medium heat. 2. Add onions, bell peppers, and garlic. Sauté until soft. 3. Add chopped carrots and cook for 5 minutes. 4. Stir in chili powder, cumin, oregano, and smoked paprika. 5. Add diced tomatoes, tomato paste, and vegetable broth. 6. Add all beans and corn. Stir well. 7. Bring to a boil, then reduce heat and simmer for 30 minutes. 8. Season with salt and pepper to taste. 9. Serve topped with avocado, cilantro, and a squeeze of lime.",
    strIngredient1: "Olive Oil",
    strIngredient2: "Onions",
    strIngredient3: "Bell Peppers",
    strIngredient4: "Garlic",
    strIngredient5: "Carrots",
    strIngredient6: "Chili Powder",
    strIngredient7: "Cumin",
    strIngredient8: "Oregano",
    strIngredient9: "Smoked Paprika",
    strIngredient10: "Diced Tomatoes",
    strIngredient11: "Tomato Paste",
    strIngredient12: "Vegetable Broth",
    strIngredient13: "Black Beans",
    strIngredient14: "Kidney Beans",
    strIngredient15: "Corn",
    strIngredient16: "Avocado",
    strIngredient17: "Cilantro",
    strIngredient18: "Lime",
    strMeasure1: "2 tbsp",
    strMeasure2: "2 medium",
    strMeasure3: "2",
    strMeasure4: "3 cloves",
    strMeasure5: "2",
    strMeasure6: "2 tbsp",
    strMeasure7: "1 tbsp",
    strMeasure8: "1 tsp",
    strMeasure9: "1 tsp",
    strMeasure10: "2 cans",
    strMeasure11: "2 tbsp",
    strMeasure12: "2 cups",
    strMeasure13: "1 can",
    strMeasure14: "1 can",
    strMeasure15: "1 cup",
    strMeasure16: "1",
    strMeasure17: "handful",
    strMeasure18: "1",
  },
  {
    idMeal: "m8",
    strMeal: "Spinach and Feta Quiche",
    strMealThumb:
      "https://www.themealdb.com/images/media/meals/twspvx1511784021.jpg",
    strCategory: "Vegetarian",
    strArea: "French",
    strTags: "vegetarian,breakfast,pie,medium",
    strInstructions:
      "1. Preheat oven to 375°F (190°C). 2. Press pie crust into a 9-inch pie dish. 3. In a large bowl, whisk eggs, milk, salt, and pepper. 4. Squeeze excess moisture from spinach. 5. Layer spinach, feta, and sautéed onions in the pie crust. 6. Pour egg mixture over the filling. 7. Bake for 35-40 minutes until center is set. 8. Let cool for 10 minutes before slicing.",
    strIngredient1: "Pie Crust",
    strIngredient2: "Eggs",
    strIngredient3: "Milk",
    strIngredient4: "Salt",
    strIngredient5: "Pepper",
    strIngredient6: "Frozen Spinach",
    strIngredient7: "Feta Cheese",
    strIngredient8: "Onion",
    strIngredient9: "Olive Oil",
    strMeasure1: "1",
    strMeasure2: "5",
    strMeasure3: "1 cup",
    strMeasure4: "1/2 tsp",
    strMeasure5: "1/4 tsp",
    strMeasure6: "10 oz",
    strMeasure7: "1 cup",
    strMeasure8: "1 small",
    strMeasure9: "1 tbsp",
  },
];

// Helper: Parse AI recipe text into title, ingredients, and instructions
function parseAIRecipe(aiText) {
  // Try to extract sections by headings
  const titleMatch = aiText.match(/^(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : "AI Recipe";

  // Find Ingredients section
  const ingredientsMatch = aiText.match(/ingredients[:\-\n]*([\s\S]*?)(?:instructions[:\-\n]|steps[:\-\n]|\n\n|$)/i);
  let ingredients = [];
  if (ingredientsMatch) {
    ingredients = ingredientsMatch[1]
      .split(/\n|\r/)
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter((line) => line.length > 1 && !/^instructions?/i.test(line));
  }

  // Find Instructions/Steps section
  const instructionsMatch = aiText.match(/(?:instructions|steps)[:\-\n]*([\s\S]*)/i);
  let instructions = "";
  if (instructionsMatch) {
    instructions = instructionsMatch[1].trim();
  } else {
    // Fallback: try to find after ingredients
    instructions = aiText.split(/ingredients[:\-\n][\s\S]*?(?:instructions[:\-\n]|steps[:\-\n]|\n\n|$)/i)[1] || "";
    instructions = instructions.trim();
  }

  return { title, ingredients, instructions };
}

const RecipeBuilder = () => {
  const { user } = useAuth();
  // States
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [suggestedIngredients, setSuggestedIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    mealType: "all",
    dietaryRestrictions: [],
    prepTime: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [apiError, setApiError] = useState(false);

  // Fetch all ingredients for suggestions
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const ingredients = await getAllIngredients();
        if (ingredients.length > 0) {
          // Extract ingredient names from the API response
          const ingredientNames = ingredients
            .map((item) => item.strIngredient.trim())
            .filter((name) => name.length > 0);
          setAllIngredients(ingredientNames);
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    };

    fetchIngredients();
  }, []);

  // Update suggestions when search input changes
  useEffect(() => {
    if (searchInput.trim().length === 0) {
      setSuggestedIngredients([]);
      return;
    }

    const searchTerm = searchInput.toLowerCase();
    const matches = allIngredients
      .filter(
        (ingredient) =>
          ingredient.toLowerCase().includes(searchTerm) &&
          !selectedIngredients.includes(ingredient)
      )
      .slice(0, 6); // Limit to 6 suggestions

    setSuggestedIngredients(matches);
  }, [searchInput, selectedIngredients, allIngredients]);

  // Check saved status of recipes when they change
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || recipes.length === 0) return;

      const savedStatusMap = {};

      for (const recipe of recipes) {
        try {
          const isSaved = await isRecipeSaved(user.id, recipe.idMeal);
          savedStatusMap[recipe.idMeal] = isSaved;
        } catch (error) {
          console.error("Error checking saved status:", error);
        }
      }

      setSavedRecipeIds(savedStatusMap);
    };

    checkSavedStatus();
  }, [recipes, user]);

  // Add ingredient from search
  const addIngredient = (ingredient) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setSearchInput("");
    setSuggestedIngredients([]);
  };

  // Remove ingredient
  const removeIngredient = (ingredient) => {
    setSelectedIngredients(
      selectedIngredients.filter((item) => item !== ingredient)
    );
  };

  // Toggle dietary restriction
  const toggleDietaryRestriction = (id) => {
    if (filters.dietaryRestrictions.includes(id)) {
      setFilters({
        ...filters,
        dietaryRestrictions: filters.dietaryRestrictions.filter(
          (item) => item !== id
        ),
      });
    } else {
      setFilters({
        ...filters,
        dietaryRestrictions: [...filters.dietaryRestrictions, id],
      });
    }
  };

  // Filter recipes based on the applied filters
  const applyFilters = (recipeList) => {
    if (!recipeList || recipeList.length === 0) return [];

    console.log("Applying filters:", filters);
    console.log("Initial recipe count:", recipeList.length);

    let filteredResults = [...recipeList];

    // Apply meal type filter
    if (filters.mealType !== "all") {
      console.log("Applying meal type filter:", filters.mealType);
      const mealTypeMap = {
        breakfast: ["breakfast", "morning", "brunch"],
        lunch: ["lunch", "midday"],
        dinner: ["dinner", "supper", "evening"],
        dessert: ["dessert", "sweet", "pudding", "cake", "pie"],
        snack: ["snack", "appetizer", "starter", "side"],
      };

      const keywords = mealTypeMap[filters.mealType] || [];

      filteredResults = filteredResults.filter((recipe) => {
        const lowerCaseTitle = (recipe.strMeal || "").toLowerCase();
        const lowerCaseCategory = (recipe.strCategory || "").toLowerCase();
        const lowerCaseTags = (recipe.strTags || "").toLowerCase();

        return keywords.some(
          (keyword) =>
            lowerCaseTitle.includes(keyword) ||
            lowerCaseCategory.includes(keyword) ||
            lowerCaseTags.includes(keyword)
        );
      });

      console.log("After meal type filter:", filteredResults.length);
    }

    // Apply dietary restrictions
    if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0) {
      console.log(
        "Applying dietary restrictions:",
        filters.dietaryRestrictions
      );

      // Define categories/ingredients to exclude for each restriction
      const exclusions = {
        vegetarian: {
          categories: ["beef", "chicken", "pork", "lamb", "seafood", "fish"],
          ingredients: [
            "meat",
            "chicken",
            "beef",
            "pork",
            "fish",
            "seafood",
            "turkey",
            "lamb",
            "bacon",
            "ham",
            "sausage",
          ],
        },
        vegan: {
          categories: [
            "beef",
            "chicken",
            "pork",
            "lamb",
            "seafood",
            "fish",
            "dairy",
          ],
          ingredients: [
            "meat",
            "chicken",
            "beef",
            "pork",
            "fish",
            "seafood",
            "turkey",
            "lamb",
            "egg",
            "milk",
            "cheese",
            "butter",
            "cream",
            "yogurt",
            "honey",
          ],
        },
        "gluten-free": {
          categories: [],
          ingredients: ["wheat", "flour", "pasta", "bread", "barley", "rye"],
        },
        "dairy-free": {
          categories: ["dairy"],
          ingredients: ["milk", "cheese", "butter", "cream", "yogurt"],
        },
        "nut-free": {
          categories: [],
          ingredients: [
            "nut",
            "almond",
            "walnut",
            "pecan",
            "cashew",
            "pistachio",
          ],
        },
      };

      // Define keywords that indicate a recipe meets a restriction
      const inclusionKeywords = {
        vegetarian: ["vegetarian", "veggie", "meatless", "veg"],
        vegan: ["vegan", "plant-based", "plant based"],
        "gluten-free": ["gluten-free", "gluten free", "no gluten", "gf"],
        "dairy-free": ["dairy-free", "dairy free", "no dairy", "df"],
        "nut-free": ["nut-free", "nut free", "no nuts"],
      };

      filteredResults = filteredResults.filter((recipe) => {
        const lowerCaseTitle = (recipe.strMeal || "").toLowerCase();
        const lowerCaseCategory = (recipe.strCategory || "").toLowerCase();
        const lowerCaseTags = (recipe.strTags || "").toLowerCase();

        // Check each selected dietary restriction
        for (const restriction of filters.dietaryRestrictions) {
          // If restriction is explicitly mentioned, include it
          const explicitlyMeetsRestriction = inclusionKeywords[
            restriction
          ]?.some(
            (keyword) =>
              lowerCaseTitle.includes(keyword) ||
              lowerCaseTags.includes(keyword)
          );

          if (explicitlyMeetsRestriction) {
            continue; // Skip other checks for this restriction
          }

          // Check for excluded categories
          const excludedCategories = exclusions[restriction]?.categories || [];
          if (
            excludedCategories.some((category) =>
              lowerCaseCategory.includes(category)
            )
          ) {
            console.log(
              `Excluding recipe: ${recipe.strMeal} - category violation for ${restriction}`
            );
            return false;
          }

          // Check for excluded ingredients in title
          const excludedIngredients =
            exclusions[restriction]?.ingredients || [];
          if (
            excludedIngredients.some((ingredient) =>
              lowerCaseTitle.includes(ingredient)
            )
          ) {
            console.log(
              `Excluding recipe: ${recipe.strMeal} - ingredient violation for ${restriction}`
            );
            return false;
          }

          // Special case for vegetarian category-based checks
          if (
            restriction === "vegetarian" &&
            (lowerCaseCategory.includes("beef") ||
              lowerCaseCategory.includes("chicken") ||
              lowerCaseCategory.includes("pork") ||
              lowerCaseCategory.includes("lamb") ||
              lowerCaseCategory.includes("seafood") ||
              lowerCaseCategory.includes("fish"))
          ) {
            console.log(
              `Excluding non-vegetarian recipe by category: ${recipe.strMeal}`
            );
            return false;
          }
        }

        return true;
      });

      console.log("After dietary restriction filters:", filteredResults.length);
    }

    // Apply preparation time filter
    if (filters.prepTime !== "all") {
      console.log("Applying prep time filter:", filters.prepTime);
      // This is a mock implementation since the API doesn't provide cook time
      const prepTimeKeywords = {
        quick: [
          "quick",
          "easy",
          "simple",
          "fast",
          "salad",
          "toast",
          "sandwich",
          "15 min",
          "15min",
          "under 15",
          "10 min",
          "10min",
          "5 min",
          "5min",
        ],
        medium: ["moderate", "medium", "30 min", "30min", "half hour"],
        long: [
          "slow",
          "roast",
          "bake",
          "stew",
          "simmer",
          "braise",
          "60 min",
          "60min",
          "hour",
          "1 hour",
          "1 hr",
        ],
      };

      filteredResults = filteredResults.filter((recipe) => {
        const lowerCaseTitle = (recipe.strMeal || "").toLowerCase();
        const lowerCaseTags = (recipe.strTags || "").toLowerCase();

        const isMatchingPrepTime = (
          prepTimeKeywords[filters.prepTime] || []
        ).some(
          (keyword) =>
            lowerCaseTitle.includes(keyword) || lowerCaseTags.includes(keyword)
        );

        // For "medium", also include recipes that don't match quick or long
        if (filters.prepTime === "medium" && !isMatchingPrepTime) {
          const isQuick = (prepTimeKeywords.quick || []).some(
            (keyword) =>
              lowerCaseTitle.includes(keyword) ||
              lowerCaseTags.includes(keyword)
          );
          const isLong = (prepTimeKeywords.long || []).some(
            (keyword) =>
              lowerCaseTitle.includes(keyword) ||
              lowerCaseTags.includes(keyword)
          );

          return !isQuick && !isLong;
        }

        return isMatchingPrepTime;
      });

      console.log("After prep time filter:", filteredResults.length);
    }

    console.log("Final filtered recipes count:", filteredResults.length);
    return filteredResults;
  };

  // Search for recipes with ingredients and/or filters

  const searchRecipes = async () => {
    setLoading(true);
    setRecipes([]);
    setApiError(false);

    try {
      let results = [];

      if (selectedIngredients.length > 0) {
        // Search by ingredients
        console.log("Searching by ingredients:", selectedIngredients);
        results = await searchByMultipleIngredients(selectedIngredients);
      } else {
        // When no ingredients are selected, get a general selection of meals
        // Use popular keywords to get varied results
        const searchTerms = [
          "chicken",
          "pasta",
          "salad",
          "vegetable",
          "beef",
          "fish",
        ];
        const randomTerm =
          searchTerms[Math.floor(Math.random() * searchTerms.length)];

        console.log("Searching by random term:", randomTerm);
        results = await searchMealsByName(randomTerm);

        // If API fails to return results, use mock data
        if (!results || results.length === 0) {
          console.log("Using mock data because API returned no results");
          results = MOCK_RECIPES;
        }
      }

      // Ensure we have results to work with
      if (!results || results.length === 0) {
        console.log("No recipes found, using mock data");
        results = MOCK_RECIPES;
      }

      console.log("Before filtering - recipe count:", results.length);
      console.log("Current filters:", filters);

      // Apply filters to the results
      const filteredResults = applyFilters(results);
      console.log("After filtering - recipe count:", filteredResults.length);

      // If no recipes match the filters, show a subset of the original results
      if (filteredResults.length === 0) {
        console.log("No recipes match the filters, trying fallbacks");

        // First try to apply the filters to our mock data
        const filteredMocks = applyFilters(MOCK_RECIPES);
        console.log("Filtered mock recipes count:", filteredMocks.length);

        if (filteredMocks.length > 0) {
          setRecipes(filteredMocks);
          setToastMessage("Using sample recipes that match your filters");
          setToastType("info");
          setShowToast(true);
        } else {
          // Even mock data doesn't match, so just show some recipes
          setRecipes(MOCK_RECIPES.slice(0, 3));
          setToastMessage(
            "No exact matches found. Showing some recipes that might interest you"
          );
          setToastType("info");
          setShowToast(true);
        }
      } else {
        setRecipes(filteredResults);
      }
    } catch (error) {
      console.error("Error searching recipes:", error);
      setApiError(true);

      // Use mock data as fallback
      const filteredMocks = applyFilters(MOCK_RECIPES);
      setRecipes(filteredMocks.length > 0 ? filteredMocks : MOCK_RECIPES);

      setToastMessage(
        "Couldn't connect to recipe service. Showing sample recipes instead"
      );
      setToastType("error");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle recipe save/unsave
  const handleSaveToggle = async (recipe) => {
    if (!user) return;

    const recipeId = recipe.idMeal;
    const isSaved = savedRecipeIds[recipeId];

    try {
      if (isSaved) {
        // Unsave the recipe
        const result = await unsaveRecipe(user.id, recipeId);
        if (result.success) {
          setSavedRecipeIds({
            ...savedRecipeIds,
            [recipeId]: false,
          });
          setToastMessage("Recipe removed from your collection");
          setToastType("info");
          setShowToast(true);
        }
      } else {
        // Save the recipe
        const recipeData = {
          id: recipeId,
          title: recipe.strMeal,
          image: recipe.strMealThumb,
          description: `${recipe.strArea || ""} ${
            recipe.strCategory || ""
          } recipe`,
          category: recipe.strCategory || "",
          time: recipe.strTags?.includes("quick")
            ? "15 min"
            : recipe.strTags?.includes("slow")
            ? "60+ min"
            : "30 min",
          difficulty: "Medium", // Placeholder
        };

        const result = await saveRecipe(user.id, recipeData);
        if (result.success) {
          setSavedRecipeIds({
            ...savedRecipeIds,
            [recipeId]: true,
          });
          setToastMessage("Recipe saved to your collection!");
          setToastType("success");
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error("Error toggling save state:", error);
      setToastMessage("Error saving recipe");
      setToastType("error");
      setShowToast(true);
    }
  };

  // Reset search
  const resetSearch = () => {
    setSelectedIngredients([]);
    setRecipes([]);
    setFilters({
      mealType: "all",
      dietaryRestrictions: [],
      prepTime: "all",
    });
  };

  // Dietary restriction options
  const dietaryOptions = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten-free", label: "Gluten-Free" },
    { id: "dairy-free", label: "Dairy-Free" },
    { id: "nut-free", label: "Nut-Free" },
  ];

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
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Recipe Builder
            </h1>
            <p className="text-gray-600">
              Enter ingredients or use filters to find the perfect recipes
            </p>
          </header>

          {/* Ingredient Search Section */}
          <section className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="mb-6">
              <label
                htmlFor="ingredient-search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Add Ingredients (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  id="ingredient-search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Type to search ingredients..."
                />
                {searchInput && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchInput("")}
                  >
                    <X
                      size={18}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  </button>
                )}
              </div>

              {/* Suggested Ingredients */}
              {suggestedIngredients.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <ul className="divide-y divide-gray-200">
                    {suggestedIngredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                        onClick={() => addIngredient(ingredient)}
                      >
                        <Plus size={16} className="text-primary-500 mr-2" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Selected Ingredients */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Ingredients
                </h3>
                {selectedIngredients.length > 0 && (
                  <button
                    onClick={resetSearch}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-sm flex items-center"
                    >
                      {ingredient}
                      <button
                        onClick={() => removeIngredient(ingredient)}
                        className="ml-1.5 text-primary-500 hover:text-primary-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 mb-4">
                  No ingredients added. You can search without ingredients to
                  browse recipes.
                </div>
              )}

              {/* Filter Toggle */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                >
                  <Filter size={16} className="mr-1.5" />
                  Filters
                  <ChevronDown
                    size={16}
                    className={`ml-1 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <button
                  onClick={searchRecipes}
                  disabled={loading}
                  className="btn-primary flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} className="mr-2" />
                      Find Recipes
                    </>
                  )}
                </button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Meal Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meal Type
                      </label>
                      <select
                        value={filters.mealType}
                        onChange={(e) =>
                          setFilters({ ...filters, mealType: e.target.value })
                        }
                        className="input-field"
                      >
                        <option value="all">All Types</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="dessert">Dessert</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>

                    {/* Preparation Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preparation Time
                      </label>
                      <select
                        value={filters.prepTime}
                        onChange={(e) =>
                          setFilters({ ...filters, prepTime: e.target.value })
                        }
                        className="input-field"
                      >
                        <option value="all">Any Time</option>
                        <option value="quick">Quick (under 15 min)</option>
                        <option value="medium">Medium (15-30 min)</option>
                        <option value="long">Long (over 30 min)</option>
                      </select>
                    </div>

                    {/* Dietary Restrictions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dietary Restrictions
                      </label>
                      <div className="space-y-1">
                        {dietaryOptions.map((option) => (
                          <label key={option.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.dietaryRestrictions.includes(
                                option.id
                              )}
                              onChange={() =>
                                toggleDietaryRestriction(option.id)
                              }
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Results Section */}
          <section>
            {loading ? (
              <div className="text-center py-12">
                <Loader
                  size={40}
                  className="animate-spin mx-auto text-primary-500 mb-4"
                />
                <p className="text-gray-600">
                  Searching for recipes with
                  {selectedIngredients.length > 0
                    ? " your ingredients"
                    : " selected filters"}
                  ...
                </p>
              </div>
            ) : recipes.length > 0 ? (
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  Found {recipes.length} Recipe{recipes.length !== 1 ? "s" : ""}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map((recipe) => (
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
                            savedRecipeIds[recipe.idMeal]
                              ? "text-red-500"
                              : "text-gray-500 hover:text-red-500"
                          } transition-colors`}
                          onClick={() => handleSaveToggle(recipe)}
                          title={
                            savedRecipeIds[recipe.idMeal]
                              ? "Remove from saved"
                              : "Save recipe"
                          }
                        >
                          {savedRecipeIds[recipe.idMeal] ? (
                            <Bookmark size={18} fill="currentColor" />
                          ) : (
                            <Bookmark size={18} />
                          )}
                        </button>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                          {recipe.strMeal}
                        </h3>

                        <div className="flex justify-between text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {recipe.strTags?.includes("quick")
                              ? "15 min"
                              : recipe.strTags?.includes("slow")
                              ? "60+ min"
                              : "30 min"}
                          </span>
                          <span className="capitalize">
                            {recipe.strArea || "International"}
                          </span>
                        </div>

                        {recipe.strCategory && (
                          <div className="mb-3">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {recipe.strCategory}
                            </span>
                          </div>
                        )}

                        <Link
                          to={`/recipe/${recipe.idMeal}`}
                          className="block w-full text-center btn-primary mt-2"
                        >
                          View Recipe
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : apiError ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Info size={40} className="mx-auto text-red-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connection Error</h3>
                <p className="text-gray-600 mb-4">
                  We had trouble connecting to our recipe service.
                </p>
                <button onClick={searchRecipes} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

export default RecipeBuilder;
