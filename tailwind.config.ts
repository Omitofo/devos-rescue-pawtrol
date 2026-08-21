import type { Config } from "tailwindcss";

/**
 * Tailwind configuration — WP-01 design-token plumbing.
 *
 * Tokens are defined as CSS custom properties in src/app/globals.css.
 * Tailwind maps those variables so components can use utility classes
 * (bg-surface, text-primary, etc.) while the actual values stay in one place.
 *
 * Full visual system (colours, typography scale, geometric accents) arrives in WP-15.
 * This file only establishes the plumbing so later work packages can extend without churn.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — values live in CSS variables (globals.css)
        surface: {
          DEFAULT: "var(--color-surface)",
          elevated: "var(--color-surface-elevated)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        border: "var(--color-border)",
        // Accent placeholders for later geometric / brand colours (WP-15)
        accent: {
          1: "var(--color-accent-1)",
          2: "var(--color-accent-2)",
          3: "var(--color-accent-3)",
        },
      },
      fontFamily: {
        // Will be refined in WP-15 against visual.md
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
