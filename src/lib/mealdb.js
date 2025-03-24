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

// Search for meals by multiple ingredients (custom function)
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
          mealIngredients.push(ingredient.toLowerCase());
        }
      }

      // Check if all of our ingredients are in the meal
      const hasAllIngredients = ingredientsList
        .slice(1)
        .every((ingredient) =>
          mealIngredients.some((mealIng) =>
            mealIng.includes(ingredient.toLowerCase())
          )
        );

      if (hasAllIngredients) {
        filteredMeals.push(mealDetails);
      }
    }

    return filteredMeals;
  } catch (error) {
    console.error("Error searching by multiple ingredients:", error);
    return [];
  }
};
