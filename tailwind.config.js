/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        page:      'var(--bg-app)',
        card:      'var(--bg-surface)',
        surface2:  'var(--bg-surface2)',
        border:    'var(--border)',
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        acento:    'var(--acento)',
        bosque:    'var(--bosque)',
        brillo:    'var(--brillo)',
        menta:     'var(--menta)',
        alerta:    'var(--alerta)',
        aviso:     'var(--aviso)',
        lavanda:   'var(--lavanda)',
        azul:      'var(--azul)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '10px',
        lg:  '14px',
        xl:  '18px',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        sidebar: 'var(--shadow-sidebar)',
      },
    },
  },
  plugins: [],
}
