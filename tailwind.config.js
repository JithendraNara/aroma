/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f8f7",
          100: "#dff1ec",
          200: "#bfe3d9",
          300: "#92cec0",
          400: "#5daf9d",
          500: "#3c9283",
          600: "#29766a",
          700: "#235f56",
          800: "#1f4c46",
          900: "#1c403c",
          950: "#0a2421",
        },
        secondary: {
          50: "#fdf7ef",
          100: "#f9ecda",
          200: "#f3d7b5",
          300: "#ebbc85",
          400: "#e49a52",
          500: "#df802f",
          600: "#cf6626",
          700: "#ac4c22",
          800: "#893d22",
          900: "#6f331f",
          950: "#3c190f",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};
