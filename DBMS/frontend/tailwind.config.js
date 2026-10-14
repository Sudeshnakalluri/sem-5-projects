/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070B14",
          900: "#0B1220",
          800: "#101A2E",
          700: "#131B2C",
          600: "#1B2540",
          500: "#232E45",
          400: "#39456A",
        },
        mist: {
          100: "#F5F7FB",
          300: "#C4CCDD",
          400: "#8B95A8",
          500: "#6B7488",
        },
        gold: {
          400: "#E8C766",
          500: "#D4AF37",
          600: "#B8943A",
        },
        mint: {
          400: "#4FE0C2",
          500: "#2FBF9F",
          600: "#1F9A80",
        },
        coral: {
          400: "#FF8A65",
          500: "#F4623A",
          600: "#D94E2B",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(212,175,55,0.25), 0 0 24px -4px rgba(212,175,55,0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
