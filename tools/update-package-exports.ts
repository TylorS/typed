// TODO: update exports in package.json with all modules

import fs from 'fs'
import path, { extname } from 'path'

import { findFilePaths, MODULES, ROOT_DIR, SOURCE_DIR } from './common'

const packageJsonPath = path.join(ROOT_DIR, 'package.json')
const packageJsonContents = fs.readFileSync(packageJsonPath).toString()
const packageJson = JSON.parse(packageJsonContents)
const TSX_REGEX = /.tsx?$/
const INDEX_REGEX = /\/?index$/

packageJson.exports = createExports()

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2).trim() + `\n`)

type ExportMap = { require: string; import: string }

export function createExports() {
  const exports: Record<string, ExportMap> = {
    '.': {
      require: './cjs/index.js',
      import: './esm/index.js',
    },
  }

  for (const module of MODULES) {
    const sourceDir = path.join(SOURCE_DIR, module)
    const isDirectory = fs.statSync(sourceDir).isDirectory()
    const name = module.replace(TSX_REGEX, '')

    exports[`./${name}`] = {
      require:
        './' + (isDirectory ? path.join('cjs', name, 'index.js') : path.join('cjs', `${name}.js`)),
      import:
        './' + (isDirectory ? path.join('esm', name, 'index.js') : path.join('esm', `${name}.js`)),
    }

    if (!isDirectory) {
      continue
    }

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
        require: './' + path.join('cjs', name, jsPath),
        import: './' + path.join('esm', name, jsPath),
      }

      const relativeName = relativePath.replace(TSX_REGEX, '').replace(INDEX_REGEX, '')

      exports[`./${name}${relativeName ? `/${relativeName}` : ''}`] = map
    }
  }

  return exports
}
