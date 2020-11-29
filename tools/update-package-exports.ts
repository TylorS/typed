// TODO: update exports in package.json with all modules

import fs from 'fs'
import path, { extname } from 'path'

import { findFilePaths, MODULES, ROOT_DIR, SOURCE_DIR } from './common'

const packageJsonPath = path.join(ROOT_DIR, 'package.json')
const packageJsonContents = fs.readFileSync(packageJsonPath).toString()
const packageJson = JSON.parse(packageJsonContents)

packageJson.exports = createExports()

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + `\n`)

type ExportMap = { require: string; import: string; browser?: string }

export function createExports() {
  const exports: Record<string, ExportMap> = {
    '.': {
      require: './cjs/exports.js',
      import: './esm/exports.js',
      browser: './browser/exports.js',
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

      if (extname(relativePath) !== '.ts') {
        continue
      }

      const jsPath = relativePath.replace('.ts', '.js')
      const map: ExportMap = {
        require: './' + path.join('cjs', module, jsPath),
        import: './' + path.join('esm', module, jsPath),
        browser: './' + path.join('build', module, jsPath),
      }

      if (module === 'node') {
        delete map.browser
      }

      exports[`./${module}/${relativePath.replace('.ts', '')}`] = map
    }
  }

  return exports
}
