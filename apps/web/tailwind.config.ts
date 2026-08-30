import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        'shadow-grey': '#262730',
        'charcoal-blue': '#373F51',
        'alabaster': '#E5E6E4',
        'blush-rose': '#DA667B',
        'pacific-cyan': '#3891A6',
      },
    },
  },
};

export default config;
