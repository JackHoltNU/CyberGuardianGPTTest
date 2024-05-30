import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        dot: {
          '0%, 20%': { opacity: "1" },
          '25%, 100%': { opacity: "0" },
        },
      },
      animation: {
        'dot1': 'dot 1.4s infinite steps(4, end)',
        'dot2': 'dot 1.4s infinite steps(4, end) 0.2s',
        'dot3': 'dot 1.4s infinite steps(4, end) 0.4s',
      }
    },
  },
  plugins: [],
};
export default config;
