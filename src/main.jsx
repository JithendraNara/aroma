import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { printSupabaseConfigDiagnostics } from "./utils/validateSupabaseConfig.js";

// Check Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Display config diagnostics (in development only)
if (import.meta.env.DEV) {
  console.log("Running in development mode");
  const isConfigValid = printSupabaseConfigDiagnostics(
    supabaseUrl,
    supabaseAnonKey
  );

  if (!isConfigValid) {
    console.warn(
      "⚠️ Supabase configuration issues detected. Recipe saving functionality will use local storage fallback."
    );
    console.log(
      "To fix this, check your .env file and ensure you have:\n" +
        "VITE_SUPABASE_URL=https://your-project-id.supabase.co\n" +
        "VITE_SUPABASE_ANON_KEY=your-anon-key"
    );
  } else {
    console.log("✅ Supabase configuration appears valid.");
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
