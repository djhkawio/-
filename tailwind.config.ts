import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0F2A43",
          700: "#1E3F5C",
          500: "#3B6A92"
        }
      }
    }
  },
  plugins: []
};

export default config;
