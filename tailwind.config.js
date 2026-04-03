/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        page:    '#F2F9FB',
        card:    '#FFFFFF',
        sidebar: '#FFFFFF',
        border:  '#E2EEF1',
        primary:   '#0f2a30',
        secondary: '#4a6b72',
        muted:     '#8aa8af',

        // Tridecenary — teal (primario)
        tri: {
          50:  '#eaf8fb', 100: '#d1f1f7', 200: '#a3e3ef',
          300: '#66d0e3', 400: '#36bed5', 500: '#2dbdd7',
          600: '#2599af', 700: '#217d8f', 800: '#1f6675',
          900: '#1d5561', 950: '#10323a',
        },
        // Tetradecenary — purple (secundario)
        tet: {
          50:  '#f4f1ff', 100: '#ebe5ff', 200: '#d9ceff',
          300: '#baabff', 400: '#9e85ff', 500: '#8a5dfe',
          600: '#7a46f4', 700: '#6a35de', 800: '#582cb9',
          900: '#492699', 950: '#2b165c',
        },
        // Pentadecenary — pink-purple (terciario)
        pen: {
          50:  '#f9f2fe', 100: '#f2e4fd', 200: '#e6cafb',
          300: '#d4a2f7', 400: '#c170f1', 500: '#c555eb',
          600: '#a93ed1', 700: '#8c32ad', 800: '#742b8e',
          900: '#602575', 950: '#3b1149',
        },

        // Semantic — income/expense permanecen para legibilidad financiera
        income:  { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
        expense: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
        saving:  { text: '#7a46f4', bg: '#f4f1ff', border: '#d9ceff' },
        fixed:   { text: '#217d8f', bg: '#eaf8fb', border: '#a3e3ef' },
        debt:    { text: '#a93ed1', bg: '#f9f2fe', border: '#e6cafb' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', '1rem'],
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '10px',
        lg:  '14px',
        xl:  '18px',
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgba(33,125,143,0.07), 0 1px 2px -1px rgba(33,125,143,0.04)',
        'card-md': '0 4px 16px 0 rgba(33,125,143,0.10)',
      },
    },
  },
  plugins: [],
}
