import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#ff3b30",
          hover: "#ff5247",
          dark: "#e0281e",
        },
        accent: {
          purple: "#a855f7",
          crimson: "#ff3b30",
          amber: "#f59e0b",
          emerald: "#10b981",
          cyan: "#00f2fe",
        },
        zinc: {
          950: "#09090b",
          900: "#121215",
          850: "#18181c",
          800: "#27272a",
          700: "#3f3f46",
          600: "#52525b",
          500: "#71717a",
          400: "#a1a1aa",
          300: "#d4d4d8",
          200: "#e4e4e7",
          100: "#f4f4f5",
          50: "#fafafa",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        xl: "22px",
        lg: "16px",
        md: "10px",
        sm: "6px",
      },
      boxShadow: {
        card: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px rgba(255, 59, 48, 0.35)",
        glowCyan: "0 0 25px rgba(0, 242, 254, 0.25)",
        modal: "0 25px 50px -12px rgba(0, 0, 0, 0.95)",
      },
    },
  },
  plugins: [],
};

export default config;
