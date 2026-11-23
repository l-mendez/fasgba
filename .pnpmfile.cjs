// TypeScript 7 (the native compiler) ships no JS compiler API, and
// typescript-eslint only supports the TypeScript 6 API. Give the lint toolchain
// the TS 6 API from @typescript/typescript6, while `tsc` and Next.js use TS 7.
// Remove this hook once typescript-eslint supports TypeScript 7.
const TS6 = 'npm:@typescript/typescript6@^6.0.2'

function needsTs6(name) {
  return (
    name === 'typescript-eslint' ||
    name.startsWith('@typescript-eslint/') ||
    name === 'ts-api-utils'
  )
}

function readPackage(pkg) {
  if (needsTs6(pkg.name) && pkg.peerDependencies?.typescript) {
    delete pkg.peerDependencies.typescript
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript
    pkg.dependencies = { ...pkg.dependencies, typescript: TS6 }
  }
  return pkg
}

module.exports = { hooks: { readPackage } }
