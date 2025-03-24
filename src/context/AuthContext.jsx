import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  useEffect(() => {
    // Check for user on initial load
    const checkUser = async () => {
      try {
        console.log("Checking for existing session");
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          console.log("Session found, user is logged in");
          setUser(data.session.user);
        } else {
          console.log("No session found, user is not logged in");
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);

        if (event === "SIGNED_IN") {
          console.log("User signed in");
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setUser(null);
        } else if (event === "USER_UPDATED") {
          console.log("User updated");
          setUser(session.user);
        } else if (event === "INITIAL_SESSION") {
          if (session) {
            console.log("Initial session found");
            setUser(session.user);
          }
        } else if (event === "SIGNED_UP") {
          // This is triggered on signup - we'll set a flag to identify new registrations
          console.log("New user registration detected");
          setIsNewRegistration(true);
          // We don't set the user here because we want to force login
        }

        setLoading(false);
      }
    );

    return () => {
      // Clean up subscription
      if (authListener?.subscription) {
        console.log("Cleaning up auth subscription");
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Value object to be provided to consumers
  const value = {
    user,
    loading,
    isNewRegistration,
    setIsNewRegistration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
