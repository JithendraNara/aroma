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
