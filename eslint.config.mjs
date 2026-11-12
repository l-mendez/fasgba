import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// Off-palette Tailwind colors (see docs/ui.md). Use theme tokens or terracotta/amber.
const OFF_PALETTE =
  '/(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|ring-offset)-(red|green|blue|yellow|purple|pink|indigo|emerald|sky|orange|teal|cyan|violet|lime|rose|fuchsia|gray|slate|zinc|neutral|stone)-[0-9]/'
const offPaletteMessage = 'Off-palette color: use theme tokens or terracotta/amber (docs/ui.md).'

// Meta descriptions over 155 characters get cut in search results (and by
// metaDescription in lib/seo.ts). Applies to string literals in page metadata.
const LONG_DESCRIPTION = '/^.{156,}$/'
const longDescriptionMessage = 'Meta description over 155 characters: shorten it (lib/seo.ts metaDescription).'
const METADATA_SCOPE =
  ":matches(CallExpression[callee.name='pageMetadata'], VariableDeclarator[id.name='metadata'], FunctionDeclaration[id.name='generateMetadata'])"
const longDescriptionRules = [
  `${METADATA_SCOPE} Property[key.name='description'] > Literal[value=${LONG_DESCRIPTION}]`,
  `VariableDeclarator[id.name='SITE_DESCRIPTION'] > Literal[value=${LONG_DESCRIPTION}]`,
].map((selector) => ({ selector, message: longDescriptionMessage }))

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
        {
          selector: "TSTypeReference[typeName.name='SupabaseClient']:not([typeArguments])",
          message: 'Use DbClient from @/lib/db-types (schema-typed) instead of a bare SupabaseClient.',
        },
        {
          selector: "TSAsExpression > TSAsExpression.expression[typeAnnotation.type='TSUnknownKeyword']",
          message: 'No `as unknown as` casts: type the source or narrow with a type guard.',
        },
        ...longDescriptionRules,
      ],
    },
  },
]

export default eslintConfig
