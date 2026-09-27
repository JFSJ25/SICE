/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta SICE: azul noche + azul electrico + superficies frias
        sidebar: '#0B1930',
        gold: '#2563EB',
        'gold-dim': '#93C5FD',
        'gold-soft': '#DBEAFE',
        ink: '#12213A',
        'ink-mid': '#40516D',
        'ink-soft': '#71819B',
        surface: '#F4F7FB',
        sice: {
          green: '#0F766E',
          'green-soft': '#DDF7F3',
          red: '#9B2E24',
          'red-soft': '#FAEAE8',
          amber: '#8A5F00',
          'amber-soft': '#FEF3D0'
        }
      },
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'sans-serif'],
        body: ['Manrope', 'ui-sans-serif', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,33,58,0.04), 0 8px 24px rgba(18,33,58,0.06)',
        md: '0 10px 30px rgba(18,33,58,0.14)'
      }
    }
  },
  plugins: []
}
