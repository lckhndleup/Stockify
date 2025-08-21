/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Stockify custom renkleri (dash ile)
        "stock-red": "#E3001B", // Ana kırmızı
        "stock-gray": "#F4F7FB", // Pasif buton/tab
        "stock-white": "#FFFEFF", // Başlıklar
        "stock-black": "#222222", // Navigation background ve text
        "stock-border": "#ECECEC", // Input border
        "stock-text": "#73767A", // Pasif text
        "stock-icon": "#6D706F", // İconlar
        "stock-dark": "#67686A", // Diğer gri ton

        // Alternatif isimlendirme (CSS custom properties gibi)
        primary: {
          DEFAULT: "#E3001B",
          50: "#FFF1F2",
          100: "#FFE4E6",
          500: "#E3001B",
          600: "#CC0018",
          700: "#B30015",
        },
      },
      fontFamily: {
        sans: ["Montserrat_400Regular"],
        medium: ["Montserrat_500Medium"],
        semibold: ["Montserrat_600SemiBold"],
        bold: ["Montserrat_700Bold"],
      },
    },
  },
  plugins: [],
};
