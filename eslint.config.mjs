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
    // No inline suppressions: fix the code instead of disabling rules.
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  {
    rules: {
      // Zero tolerance: every warning-level rule fails lint.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'prefer-const': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=${OFF_PALETTE}]`, message: offPaletteMessage },
        { selector: `TemplateElement[value.raw=${OFF_PALETTE}]`, message: offPaletteMessage },
      ],
    },
  },
]

export default eslintConfig
