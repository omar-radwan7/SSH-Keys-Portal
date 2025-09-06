/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
        arabic: ['Cairo', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    // RTL support plugin
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        '.text-start': {
          'text-align': 'var(--text-align-start)',
        },
        '.text-end': {
          'text-align': 'var(--text-align-end)',
        },
        '.ms-auto': {
          'margin-inline-start': 'auto',
        },
        '.me-auto': {
          'margin-inline-end': 'auto',
        },
        '.ps-4': {
          'padding-inline-start': theme('spacing.4'),
        },
        '.pe-4': {
          'padding-inline-end': theme('spacing.4'),
        },
        '.border-s': {
          'border-inline-start-width': '1px',
        },
        '.border-e': {
          'border-inline-end-width': '1px',
        },
        // Focus styles for better accessibility
        '.focus-visible': {
          '&:focus-visible': {
            outline: '2px solid #3b82f6',
            'outline-offset': '2px',
          },
        },
        // High contrast mode support
        '@media (prefers-contrast: high)': {
          '.high-contrast': {
            'border-color': 'ButtonText',
            'background-color': 'ButtonFace',
            'color': 'ButtonText',
          },
        },
        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          '.motion-reduce': {
            'animation-duration': '0.01ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.01ms !important',
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
} 