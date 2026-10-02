/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F3F6FA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1F64D8",
          600: "#1F64D8"
        },
        navy: {
          950: "#0B162B"
        },
        ink: {
          900: "#142833"
        },
        cyan: {
          500: "#0BA4C7"
        },
        purple: {
          500: "#7657D6"
        },
        success: {
          DEFAULT: "#16A35B"
        },
        warning: {
          DEFAULT: "#D66A00"
        },
        critical: {
          DEFAULT: "#D63D4A"
        },
        border: "#E2E8F0",
        text: {
          primary: "#142833",
          secondary: "#64748B",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '2xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        '2xl': '24px',
        'section': '32px'
      }
    },
  },
  plugins: [],
}
