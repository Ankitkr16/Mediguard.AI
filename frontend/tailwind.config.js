/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#090d16',        // Deep space medical dark background
          card: 'rgba(17, 25, 40, 0.75)', // Glassmorphic dark card
          primary: '#0ea5e9',   // Sky blue / Medical primary
          teal: '#0d9488',      // Deep teal / Medical secondary
          accent: '#8b5cf6',    // Violet accent
          border: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(14, 165, 233, 0.15)'
        },
        risk: {
          low: '#10b981',       // Emerald green
          medium: '#f59e0b',    // Amber
          high: '#ef4444'       // Rose red
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
