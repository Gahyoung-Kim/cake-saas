import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           'var(--color-bg)',
        surface:      'var(--color-surface)',
        'surface-2':  'var(--color-surface-2)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark:    'var(--color-primary-dark)',
          light:   'var(--color-primary-light)',
        },
        muted:        'var(--color-muted)',
        ink: {
          DEFAULT: 'var(--color-text)',
          sub:     'var(--color-text-sub)',
          muted:   'var(--color-text-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
        status: {
          'inquiry-bg':   'var(--status-inquiry-bg)',
          'inquiry-fg':   'var(--status-inquiry-fg)',
          'confirmed-bg': 'var(--status-confirmed-bg)',
          'confirmed-fg': 'var(--status-confirmed-fg)',
          'making-bg':    'var(--status-making-bg)',
          'making-fg':    'var(--status-making-fg)',
          'done-bg':      'var(--status-done-bg)',
          'done-fg':      'var(--status-done-fg)',
          'cancel-bg':    'var(--status-cancel-bg)',
          'cancel-fg':    'var(--status-cancel-fg)',
        },
      },
      fontFamily: {
        ko:   ['var(--font-ko)'],
        num:  ['var(--font-num)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        h1:      ['24px', { lineHeight: '1.6', fontWeight: '600' }],
        h2:      ['20px', { lineHeight: '1.6', fontWeight: '500' }],
        h3:      ['16px', { lineHeight: '1.6', fontWeight: '500' }],
        body:    ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        '0':  '0',
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '5':  '24px',
        '6':  '32px',
        '7':  '48px',
        '8':  '64px',
      },
      borderRadius: {
        sm:    '4px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '24px',
        full:  '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(61,43,36,.04), 0 1px 1px rgba(61,43,36,.03)',
        md: '0 4px 12px rgba(61,43,36,.06), 0 1px 3px rgba(61,43,36,.04)',
        lg: '0 20px 40px rgba(61,43,36,.08), 0 4px 12px rgba(61,43,36,.04)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      screens: {
        sm:    '640px',
        md:    '768px',
        lg:    '1024px',
        xl:    '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

export default config;
