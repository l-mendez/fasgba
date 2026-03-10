import nextConfig from 'eslint-config-next'

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Downgrade pre-existing issues to warnings
      'react/no-unescaped-entities': 'warn',
      'react/no-children-prop': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
    },
  },
]

export default eslintConfig
