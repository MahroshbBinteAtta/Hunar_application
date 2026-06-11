/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hunar: {
          primary: '#00A88F',    // Mint Emerald — primary CTA
          dark: '#0B0F17',       // Obsidian Dark — backgrounds
          card: '#121824',       // Charcoal card backgrounds
          accent: '#1E293B',     // Slate border accent
          gold: '#EAB308',       // Amber gold
          silver: '#94A3B8',     // Muted slate silver
          bronze: '#B45309',     // Copper bronze
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          text: '#E2E8F0',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Outfit"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
