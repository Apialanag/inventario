/** @type {import('tailwindcss').Config} */
export default {
  // Añadimos esta línea para activar el modo oscuro por clase
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
