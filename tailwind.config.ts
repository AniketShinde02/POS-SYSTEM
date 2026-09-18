import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#E85002",
          "orange-hover": "#FF5F12",
          "orange-dark": "#C10801",
          black: "#000000",
          "dark-gray": "#333333",
          gray: "#646464",
          "light-gray": "#A7A7A7",
          white: "#F9F9F9",
        },
        primary: {
          DEFAULT: "#E85002",
          foreground: "#F9F9F9",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #000000 0%, #C10801 35%, #F16001 70%, #D9C3AB 100%)",
        "orange-gradient": "linear-gradient(135deg, #E85002 0%, #F16001 50%, #C10801 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(232, 80, 2, 0.05) 0%, rgba(0, 0, 0, 0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
