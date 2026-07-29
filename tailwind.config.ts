import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                gec: {
                    navy: "#153749", // Primary Background / Text on light
                    orange: "#F05324", // Primary Accent / CTA
                    green: "#049978", // Secondary Accent
                    yellow: "#F0B91C", // Highlight
                    teal: "#226263", // Secondary Background
                    white: "#FFFFFF",
                },
            },
            fontFamily: {
                sans: ["Calibri", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
