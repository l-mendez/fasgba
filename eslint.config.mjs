import nextConfig from 'eslint-config-next'

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Pre-existing issues in codebase - suppress for now
      'react/no-unescaped-entities': 'off',
      'react/no-children-prop': 'warn',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
      // New React 19 strict rules - existing code not yet adapted
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default eslintConfig
