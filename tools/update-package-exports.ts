// TODO: update exports in package.json with all modules

import fs from 'fs'
import path from 'path'

import { findFilePaths, MODULES, ROOT_DIR, SOURCE_DIR } from './common'

const packageJsonPath = path.join(ROOT_DIR, 'package.json')
const packageJsonContents = fs.readFileSync(packageJsonPath).toString()
const packageJson = JSON.parse(packageJsonContents)

packageJson.exports = createExports()

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + `\n`)

export function createExports() {
  const exports: Record<string, { require: string; import: string; browser: string }> = {
    '.': {
      require: './cjs/exports.js',
      import: './esm/exports.js',
      browser: './browser/exprts.js',
    },
  }

  for (const module of MODULES) {
    exports[`./${module}`] = {
      require: './' + path.join('cjs', module, 'exports.js'),
      import: './' + path.join('esm', module, 'exports.js'),
      browser: './' + path.join('build', module, 'exports.js'),
    }

    const sourceDir = path.join(SOURCE_DIR, module)
    const filePaths = findFilePaths(sourceDir, [
      '!**/*.browser-test.ts',
      '!**/*.test.ts',
      '**/*.ts',
    ])

    for (const filePath of filePaths) {
      const relativePath = path.relative(sourceDir, filePath)

      exports[`./${module}/${relativePath.replace('.ts', '')}`] = {
        require: './' + path.join('cjs', module, relativePath.replace('.ts', '.js')),
        import: './' + path.join('esm', module, relativePath.replace('.ts', '.js')),
        browser: './' + path.join('build', module, relativePath.replace('.ts', '.js')),
      }
    }
  }

  return exports
}
