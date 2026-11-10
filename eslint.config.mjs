import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// Off-palette Tailwind colors (see docs/ui.md). Use theme tokens or terracotta/amber.
const OFF_PALETTE =
  '/(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|ring-offset)-(red|green|blue|yellow|purple|pink|indigo|emerald|sky|orange|teal|cyan|violet|lime|rose|fuchsia|gray|slate|zinc|neutral|stone)-[0-9]/'
const offPaletteMessage = 'Off-palette color: use theme tokens or terracotta/amber (docs/ui.md).'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/no-children-prop': 'warn',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'prefer-const': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=${OFF_PALETTE}]`, message: offPaletteMessage },
        { selector: `TemplateElement[value.raw=${OFF_PALETTE}]`, message: offPaletteMessage },
      ],
    },
  },
]

export default eslintConfig
