/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        "ui-black": "#0A122D",
        "ui-primary": "#FDAF3C",
        "ui-secondary": "#1E3DAE",
        "ui-emerald": "#2FB49C",
        "ui-red": "#FF543B",
        "ui-sky": "#F1F7F5",
        "ui-gray-50": "#F9FAFB",
        "ui-gray-100": "#F4F4F6",
        "ui-gray-200": "#E5E6EB",
        "ui-gray-300": "#D3D5DA",
        "ui-gray-400": "#9EA3AE",
        "ui-gray-500": "#6C727F",
        "ui-gray-600": "#4D5461",
        "ui-gray-700": "#394150",
        "ui-gray-800": "#212936",
        "ui-gray-900": "#0B0A0F",
      },
      fontFamily: {
        sans: ["Montserrat_400Regular"], // varsayılan
        medium: ["Montserrat_500Medium"],
        semibold: ["Montserrat_600SemiBold"],
        bold: ["Montserrat_700Bold"],
      },
    },
  },
  plugins: [],
};
