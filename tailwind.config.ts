import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        obsidian: "#0A0B0D",
        carbon: "#141518",
        slate: "#2A2D33",
        bone: "#D9D9DC",
        paper: "#F4F4F2",
        accent: "#57C7D6",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
  // Prevent JIT from purging arbitrary transition class used in accordions
  safelist: ["transition-[grid-template-rows]"],
};
export default config;
