// TheMealDB API client
const API_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// Search for meals by name
export const searchMealsByName = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search.php?s=${name}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error searching meals:", error);
    return [];
  }
};

// Search for meals by main ingredient
export const searchMealsByIngredient = async (ingredient) => {
  try {
    const response = await fetch(`${API_BASE_URL}/filter.php?i=${ingredient}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error searching meals by ingredient:", error);
    return [];
  }
};

// Get meal details by ID
export const getMealById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
    const data = await response.json();
    return data.meals?.[0] || null;
  } catch (error) {
    console.error("Error getting meal details:", error);
    return null;
  }
};

// Get list of all ingredients
export const getAllIngredients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/list.php?i=list`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error getting ingredients:", error);
    return [];
  }
};

// Helper function to normalize ingredient names
const normalizeIngredient = (ingredient) => {
  return ingredient
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to calculate recipe difficulty
const calculateDifficulty = (recipe) => {
  const ingredientCount = Object.keys(recipe)
    .filter(key => key.startsWith('strIngredient') && recipe[key])
    .length;
  
  const instructionLength = recipe.strInstructions?.split(/\d+\./).length || 0;
  
  if (ingredientCount > 10 || instructionLength > 8) return "Advanced";
  if (ingredientCount > 6 || instructionLength > 5) return "Intermediate";
  return "Beginner";
};

// Helper function to estimate cooking time
const estimateCookingTime = (recipe) => {
  const instructions = recipe.strInstructions?.toLowerCase() || '';
  const ingredients = Object.keys(recipe)
    .filter(key => key.startsWith('strIngredient') && recipe[key])
    .length;

  if (instructions.includes('overnight') || instructions.includes('hours')) {
    return '60+ min';
  } else if (
    instructions.includes('simmer') || 
    instructions.includes('bake') || 
    ingredients > 8
  ) {
    return '30-60 min';
  } else if (instructions.includes('quick') || ingredients <= 5) {
    return '15-30 min';
  }
  return '30-45 min';
};

// Enhanced search by multiple ingredients
export const searchByMultipleIngredients = async (ingredientsList) => {
  try {
    // First, get all meals for the first ingredient
    const firstIngredient = ingredientsList[0];
    let potentialMeals = await searchMealsByIngredient(firstIngredient);

    // If we only have one ingredient or no meals found, return the result
    if (ingredientsList.length === 1 || !potentialMeals.length) {
      return potentialMeals;
    }

    // For each potential meal, check if it contains all other ingredients
    const filteredMeals = [];

    for (const meal of potentialMeals) {
      const mealDetails = await getMealById(meal.idMeal);

      // If we couldn't get details, skip this meal
      if (!mealDetails) continue;

      // Extract all ingredients from the meal
      const mealIngredients = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = mealDetails[`strIngredient${i}`];
        if (ingredient && ingredient.trim()) {
          mealIngredients.push(normalizeIngredient(ingredient));
        }
      }

      // Enhanced ingredient matching with fuzzy search
      const hasAllIngredients = ingredientsList
        .slice(1)
        .every((ingredient) => {
          const normalizedInput = normalizeIngredient(ingredient);
          return mealIngredients.some((mealIng) => 
            mealIng.includes(normalizedInput) || 
            normalizedInput.includes(mealIng) ||
            levenshteinDistance(mealIng, normalizedInput) <= 2
          );
        });

      if (hasAllIngredients) {
        // Add additional metadata
        mealDetails.difficulty = calculateDifficulty(mealDetails);
        mealDetails.estimatedTime = estimateCookingTime(mealDetails);
        filteredMeals.push(mealDetails);
      }
    }

    return filteredMeals;
  } catch (error) {
    console.error("Error searching by multiple ingredients:", error);
    return [];
  }
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
}
