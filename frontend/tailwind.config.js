/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode support with class-based toggling
  darkMode: ["class"],
  // Specify which files to scan for Tailwind classes
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/features/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  // Prefix all Tailwind classes to avoid conflicts with existing styles
  prefix: "",
  theme: {
    // Container configuration for responsive layouts
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Custom color palette based on the project's cyan/teal/blue theme
      colors: {
        // Border and input colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Primary color scheme (Blues)
        primary: {
          DEFAULT: "#1976d2",
          dark: "#1565c0",
          light: "#e3f2fd",
          foreground: "#ffffff",
        },
        // Cyan color scheme
        cyan: {
          DEFAULT: "#00acc1",
          dark: "#00838f",
          light: "#e0f7fa",
        },
        // Teal color scheme
        teal: {
          DEFAULT: "#26a69a",
          dark: "#00695c",
          light: "#e0f2f1",
        },
        // Secondary colors
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Destructive colors (for errors/warnings)
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Muted colors for less prominent elements
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // Accent colors for highlights
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Popover colors
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Card colors
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic colors
        success: {
          DEFAULT: "#2e7d32",
          light: "#e8f5e9",
        },
        warning: {
          DEFAULT: "#f57c00",
          light: "#fff3e0",
        },
        error: {
          DEFAULT: "#d32f2f",
          light: "#ffebee",
        },
      },
      // Border radius values for consistent rounded corners
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Keyframe animations
      keyframes: {
        // Accordion expand/collapse animation
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Count-up animation for numbers
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Fade-in animation
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Slide-up animation
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      // Animation utility classes
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "count-up": "count-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
    },
  },
  // Include Tailwind's animate plugin for additional animation utilities
  plugins: [require("tailwindcss-animate")],
}

