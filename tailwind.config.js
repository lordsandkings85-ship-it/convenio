/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Preflight (Tailwind's CSS reset) is intentionally NOT imported in index.css
  // so it doesn't clash with the site's existing hand-written CSS.
  theme: {
    extend: {
      colors: {
        // Mirrors the CSS custom properties in src/index.css so Tailwind-based
        // components (Admin Dashboard, Chatbot, Leads) match the site's brand.
        primary: {
          DEFAULT: '#e01a22',
          hover: '#c1151c',
        },
        navy: '#0b1120',
        surface: '#f8f9fa',
        borderMuted: '#eaeaea',
        ink: '#1e293b',
        inkLight: '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'elevated': '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
        'glow-primary': '0 0 20px rgba(224, 26, 34, 0.15)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-bottom': 'slide-in-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
