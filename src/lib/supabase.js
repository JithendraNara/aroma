import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Auth functions
export const signUp = async (email, password, fullName) => {
  console.log("Starting signup process for:", email);

  // First register the user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // Store the name in auth.users metadata
      },
    },
  });

  if (error) {
    console.error("Auth signup error:", error);
    throw error;
  }

  console.log(
    "Auth signup successful:",
    data.user ? data.user.id : "No user ID"
  );

  // If registration is successful, store additional user data in the users table
  if (data.user) {
    console.log("Attempting to create user profile in 'users' table");
    try {
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email: email,
          full_name: fullName,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        console.error("Error details:", JSON.stringify(profileError, null, 2));
      } else {
        console.log("User profile created successfully in 'users' table");
      }
    } catch (insertError) {
      console.error("Exception when inserting user profile:", insertError);
    }

    // Sign out immediately after signup to force a new login
    console.log("Signing out user after registration to force login flow");
    try {
      await supabase.auth.signOut();
      console.log("User signed out successfully after registration");
    } catch (signOutError) {
      console.error("Error signing out after registration:", signOutError);
    }
  }

  return data;
};

export const signIn = async (email, password) => {
  console.log("Attempting to sign in user:", email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    throw error;
  }

  console.log("Sign in successful");
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
    throw error;
  }
  console.log("User signed out successfully");
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Function to check if user exists in the 'users' table
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Function to check if the saved_recipes table exists
export const checkSavedRecipesTableExists = async () => {
  try {
    const { error } = await supabase
      .from("saved_recipes")
      .select("id")
      .limit(1);

    // If there's an error about the relation not existing
    if (error && error.code === "42P01") {
      console.error("The saved_recipes table does not exist in the database.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking saved_recipes table:", error);
    return false;
  }
};

// Local storage keys for fallback mode
const SAVED_RECIPES_KEY = "thearoma_saved_recipes";

// Helper function to get saved recipes from local storage
const getLocalSavedRecipes = (userId) => {
  try {
    const savedRecipesMap = JSON.parse(
      localStorage.getItem(SAVED_RECIPES_KEY) || "{}"
    );
    return savedRecipesMap[userId] || [];
  } catch (error) {
    console.error("Error reading from local storage:", error);
    return [];
  }
};

// Helper function to save recipes to local storage
const saveLocalRecipes = (userId, recipes) => {
  try {
    const savedRecipesMap = JSON.parse(
      localStorage.getItem(SAVED_RECIPES_KEY) || "{}"
    );
    savedRecipesMap[userId] = recipes;
    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(savedRecipesMap));
    return true;
  } catch (error) {
    console.error("Error writing to local storage:", error);
    return false;
  }
};

// Recipe saving functionality
// Function to save a recipe to user's collection
export const saveRecipe = async (userId, recipeData) => {
  try {
    console.log("Saving recipe:", recipeData.title, "for user:", userId);

    // First try using Supabase
    try {
      // Check if already saved
      const { data: existingRecipe, error: checkError } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", userId)
        .eq("recipe_id", recipeData.id)
        .maybeSingle();

      if (checkError) {
        if (checkError.message?.includes("does not exist")) {
          throw new Error("Table does not exist");
        }
        throw checkError;
      }

      if (existingRecipe) {
        console.log("Recipe already saved");
        return { success: true, message: "Recipe already saved" };
      }

      // Save the recipe
      const { error: saveError } = await supabase.from("saved_recipes").insert([
        {
          user_id: userId,
          recipe_id: recipeData.id,
          title: recipeData.title,
          image: recipeData.image || null,
          description: recipeData.description || "",
          category: recipeData.category || "",
          time: recipeData.time || "",
          difficulty: recipeData.difficulty || "",
          saved_date: new Date().toISOString(),
        },
      ]);

      if (saveError) throw saveError;

      console.log("Recipe saved successfully to Supabase");
      return { success: true, message: "Recipe saved successfully" };
    } catch (supabaseError) {
      console.warn(
        "Supabase error, using local storage fallback:",
        supabaseError
      );

      // Local storage fallback
      const savedRecipes = getLocalSavedRecipes(userId);

      // Check if already saved
      const alreadySaved = savedRecipes.some(
        (recipe) => recipe.recipe_id === recipeData.id
      );
      if (alreadySaved) {
        console.log("Recipe already saved in local storage");
        return { success: true, message: "Recipe already saved" };
      }

      // Add new recipe
      savedRecipes.push({
        recipe_id: recipeData.id,
        title: recipeData.title,
        image: recipeData.image || null,
        description: recipeData.description || "",
        category: recipeData.category || "",
        time: recipeData.time || "",
        difficulty: recipeData.difficulty || "",
        saved_date: new Date().toISOString(),
      });

      const saved = saveLocalRecipes(userId, savedRecipes);
      if (saved) {
        console.log("Recipe saved successfully to local storage");
        return {
          success: true,
          message: "Recipe saved successfully (local storage)",
          usingLocalStorage: true,
        };
      } else {
        return {
          success: false,
          message: "Failed to save recipe to local storage",
        };
      }
    }
  } catch (error) {
    console.error("Error saving recipe:", error);
    return { success: false, message: "Failed to save recipe" };
  }
};

// Function to remove a recipe from saved collection
export const unsaveRecipe = async (userId, recipeId) => {
  try {
    console.log("Removing recipe:", recipeId, "for user:", userId);

    // First try using Supabase
    try {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipeId);

      if (error) {
        if (error.message?.includes("does not exist")) {
          throw new Error("Table does not exist");
        }
        throw error;
      }

      console.log("Recipe removed from saved collection");
      return { success: true, message: "Recipe removed from saved collection" };
    } catch (supabaseError) {
      console.warn(
        "Supabase error, using local storage fallback:",
        supabaseError
      );

      // Local storage fallback
      const savedRecipes = getLocalSavedRecipes(userId);
      const filteredRecipes = savedRecipes.filter(
        (recipe) => recipe.recipe_id !== recipeId
      );

      if (filteredRecipes.length === savedRecipes.length) {
        console.log("Recipe not found in local storage");
        return {
          success: false,
          message: "Recipe not found in your collection",
        };
      }

      const saved = saveLocalRecipes(userId, filteredRecipes);
      if (saved) {
        console.log("Recipe removed successfully from local storage");
        return {
          success: true,
          message: "Recipe removed from saved collection",
          usingLocalStorage: true,
        };
      } else {
        return {
          success: false,
          message: "Failed to remove recipe from local storage",
        };
      }
    }
  } catch (error) {
    console.error("Error removing recipe:", error);
    return { success: false, message: "Failed to remove recipe" };
  }
};

// Function to get user's saved recipes
export const getSavedRecipes = async (userId) => {
  try {
    console.log("Fetching saved recipes for user:", userId);

    // First try using Supabase
    try {
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", userId)
        .order("saved_date", { ascending: false });

      if (error) {
        if (error.message?.includes("does not exist")) {
          throw new Error("Table does not exist");
        }
        throw error;
      }

      console.log(`Found ${data?.length || 0} saved recipes`);
      return data || [];
    } catch (supabaseError) {
      console.warn(
        "Supabase error, using local storage fallback:",
        supabaseError
      );

      // Local storage fallback
      const savedRecipes = getLocalSavedRecipes(userId);
      console.log(
        `Found ${savedRecipes.length} saved recipes in local storage`
      );

      // Add a flag to indicate we're using local storage
      return savedRecipes.map((recipe) => ({
        ...recipe,
        usingLocalStorage: true,
      }));
    }
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    return [];
  }
};

// Function to check if a recipe is saved
export const isRecipeSaved = async (userId, recipeId) => {
  try {
    // First try using Supabase
    try {
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", userId)
        .eq("recipe_id", recipeId)
        .maybeSingle();

      if (error) {
        if (error.message?.includes("does not exist")) {
          throw new Error("Table does not exist");
        }
        throw error;
      }

      return !!data; // Convert to boolean
    } catch (supabaseError) {
      console.warn(
        "Supabase error when checking saved status, using local storage:",
        supabaseError
      );

      // Local storage fallback
      const savedRecipes = getLocalSavedRecipes(userId);
      return savedRecipes.some((recipe) => recipe.recipe_id === recipeId);
    }
  } catch (error) {
    console.error("Error checking if recipe is saved:", error);
    return false;
  }
};
