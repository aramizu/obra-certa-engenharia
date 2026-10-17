import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        graphite: {
          DEFAULT: "var(--graphite)",
          2: "var(--graphite-2)",
        },
        concrete: "var(--concrete)",
        paper: "var(--paper)",
        safety: {
          DEFAULT: "var(--safety)",
          ink: "var(--safety-ink)",
        },
        signal: {
          DEFAULT: "var(--signal)",
          ink: "var(--signal-ink)",
          wash: "var(--signal-wash)",
        },
        blueprint: {
          DEFAULT: "var(--blueprint)",
          ink: "var(--blueprint-ink)",
          wash: "var(--blueprint-wash)",
        },
        done: {
          DEFAULT: "var(--done)",
          ink: "var(--done-ink)",
          wash: "var(--done-wash)",
        },
        delay: {
          DEFAULT: "var(--delay)",
          ink: "var(--delay-ink)",
          wash: "var(--delay-wash)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-oswald)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        data: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        stamp: "4px 4px 0 0 var(--graphite)",
      },
    },
  },
  plugins: [],
} satisfies Config;
