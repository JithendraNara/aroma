// Utility to verify if the Supabase configuration is valid

/**
 * Checks if the Supabase URL and API key look valid
 * @param {string} url - The Supabase URL
 * @param {string} key - The Supabase API key
 * @returns {boolean} - Whether the configuration appears valid
 */
export const hasValidSupabaseConfig = (url, key) => {
  // Basic format checks
  if (!url || !key) return false;

  if (!url.startsWith("https://")) return false;

  // API keys should be fairly long
  if (key.length < 10) return false;

  // Check for the expected Supabase URL format
  // Should be like: https://something.supabase.co
  const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;

  return urlPattern.test(url);
};

/**
 * Checks if the Supabase API key is a valid anon key
 * @param {string} key - The Supabase API key
 * @returns {boolean} - Whether the key appears to be a valid anon key
 */
export const isValidAnonKey = (key) => {
  if (!key) return false;

  // Anon keys typically start with 'eyJ' (base64 encoded JWT)
  // or are UUID-like strings
  const jwtPattern =
    /^eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Check for common key formats
  return jwtPattern.test(key) || uuidPattern.test(key);
};

/**
 * Provides friendly error message about Supabase configuration issues
 * @param {string} url - The Supabase URL
 * @param {string} key - The Supabase API key
 * @returns {string|null} - Error message or null if no issues detected
 */
export const getSupabaseConfigError = (url, key) => {
  if (!url && !key) {
    return "Both Supabase URL and API key are missing";
  }

  if (!url) {
    return "Supabase URL is missing";
  }

  if (!key) {
    return "Supabase API key is missing";
  }

  if (!url.startsWith("https://")) {
    return "Supabase URL should start with https://";
  }

  if (key.length < 10) {
    return "Supabase API key appears to be too short";
  }

  const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;
  if (!urlPattern.test(url)) {
    return "Supabase URL format appears invalid (should be like https://yourproject.supabase.co)";
  }

  if (!isValidAnonKey(key)) {
    return "Supabase API key format appears invalid";
  }

  return null; // No issues detected
};

/**
 * Helper function to print Supabase configuration diagnostics to console
 * @param {string} url - The Supabase URL
 * @param {string} key - The Supabase API key
 */
export const printSupabaseConfigDiagnostics = (url, key) => {
  console.group("Supabase Configuration Diagnostics");

  // Check URL
  console.log("URL provided:", url ? "Yes" : "No");
  if (url) {
    console.log(
      "URL starts with https://:",
      url.startsWith("https://") ? "Yes" : "No"
    );
    const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;
    console.log(
      "URL matches expected pattern:",
      urlPattern.test(url) ? "Yes" : "No"
    );
  }

  // Check key
  console.log("API key provided:", key ? "Yes" : "No");
  if (key) {
    console.log("API key length:", key.length);
    console.log("Looks like a JWT:", key.startsWith("eyJ") ? "Yes" : "No");
  }

  // Overall assessment
  const isValid = hasValidSupabaseConfig(url, key);
  console.log("Overall configuration appears valid:", isValid ? "Yes" : "No");

  if (!isValid) {
    const error = getSupabaseConfigError(url, key);
    console.log("Likely issue:", error);
  }

  console.groupEnd();

  return isValid;
};

export default {
  hasValidSupabaseConfig,
  isValidAnonKey,
  getSupabaseConfigError,
  printSupabaseConfigDiagnostics,
};
