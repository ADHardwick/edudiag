import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './emails/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        accent: '#2a9d8f',
        surface: '#f8f9fa',
        'text-primary': '#1a1a2e',
        'text-secondary': '#6b7280',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
