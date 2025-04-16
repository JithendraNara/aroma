import React, { createContext, useContext, useState, useEffect } from "react";
import { isRecipeSaved } from "../lib/supabase";
import Toast from "./common/Toast";

// Create context
const DatabaseStatusContext = createContext({
  savedRecipesTableExists: null,
  isCheckingTables: true,
});

// Custom hook to use the context
export const useDatabaseStatus = () => useContext(DatabaseStatusContext);

// Provider component
export const DatabaseStatusProvider = ({ children }) => {
  const [savedRecipesTableExists, setSavedRecipesTableExists] = useState(null);
  const [isCheckingTables, setIsCheckingTables] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const checkTables = async () => {
      try {
        setIsCheckingTables(true);

        // Try to check if the table exists by making a simple query
        // We'll use isRecipeSaved with dummy values - if it returns an error about "relation not found"
        // we know the table doesn't exist
        try {
          // This is just a test call to see if we get back an API error
          await isRecipeSaved("test-user-id", "test-recipe-id");
          // If we get here, it means the function didn't throw an error,
          // so we assume the table exists or the fallback is working
          setSavedRecipesTableExists(true);
        } catch (error) {
          if (
            error.message &&
            error.message.includes("relation") &&
            error.message.includes("does not exist")
          ) {
            setSavedRecipesTableExists(false);
            setShowToast(true);
          } else {
            // Some other error occurred, but the table might still exist
            console.error("Error checking database:", error);
            setSavedRecipesTableExists(true);
          }
        }
      } catch (error) {
        console.error("Error in database check:", error);
        setSavedRecipesTableExists(false);
      } finally {
        setIsCheckingTables(false);
      }
    };

    checkTables();
  }, []);

  // Define the context value
  const contextValue = {
    savedRecipesTableExists,
    isCheckingTables,
  };

  return (
    <DatabaseStatusContext.Provider value={contextValue}>
      {children}

      {/* Toast notification for missing table */}
      {showToast && !savedRecipesTableExists && (
        <Toast
          message="Recipe saving feature is currently unavailable. Please check the database setup."
          type="warning"
          duration={6000}
          onClose={() => setShowToast(false)}
        />
      )}
    </DatabaseStatusContext.Provider>
  );
};

export default DatabaseStatusProvider;
