/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'slate-750': '#243246',
        'slate-850': '#18202d',
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'idol': 'inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
      },
      spacing: {
        '14': '3.5rem',
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
        'idol': 'background-color, box-shadow, opacity, transform',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
    },
  },
  plugins: [],
  future: {
    purgeLayersByDefault: true,
  },
}