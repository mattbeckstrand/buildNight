import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jet: "#000000",
        royal: "#6B46C1",
        lime: "#D4FF00",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        header: ["Montserrat", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        chess: "0 6px 32px 0 rgba(0,0,0,0.7)",
      },
      borderRadius: {
        chess: "0px",
      },
    },
  },
  plugins: [],
} satisfies Config;
