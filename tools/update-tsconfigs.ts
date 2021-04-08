import * as fs from 'fs'
import { EOL } from 'os'
import { dirname, join, relative } from 'path'
import { promisify } from 'util'

import { getRelativeFile, MODULES, ROOT_DIR } from './common'

const writeFile = promisify(fs.writeFile)

type ModuleType = 'esm' | 'cjs'

const CJS_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.cjs.json')
const ESM_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.esm.json')
const ESM_BUILD_PATH = join(ROOT_DIR, 'esm')
const CJS_BUILD_PATH = join(ROOT_DIR, 'cjs')
const TSX_REGX = /.tsx?$/

const BASE_PLUGINS = [
  {
    transform: '@zerollup/ts-transform-paths',
    after: true,
  },
  {
    transform: '@zerollup/ts-transform-paths',
    afterDeclarations: true,
  },
  {
    transform: '@zoltu/typescript-transformer-append-js-extension/output/index.js',
    after: true,
  },
  {
    transform: '@zoltu/typescript-transformer-append-js-extension/output/index.js',
    afterDeclarations: true,
  },
]

const EXCLUSIONS = [
  'examples',
  'node_modules',
  'src/**/*.test.ts',
  'src/**/*.browser-test.ts',
  'tools',
  'cjs',
  'esm',
  'build',
  'index.js',
  'index.d.ts',
  'index.js.map',
  'index.d.ts.map',
  ...MODULES.map((x) => x.replace(TSX_REGX, '')),
]

const updateBuildConfigs = () =>
  Promise.all<unknown>([
    updateBuildConfig(ESM_BUILD_TSCONFIG_PATH, 'esm'),
    updateBuildConfig(CJS_BUILD_TSCONFIG_PATH, 'cjs'),
  ]).then(() => process.stdout.write(EOL))

updateBuildConfigs().catch((error) => {
  console.error(error)

  process.exit(1)
})

async function updateBuildConfig(path: string, moduleType: ModuleType) {
  try {
    console.log(`Updating Build Config [${moduleType}]: ${path}`)

    const json = fs.existsSync(path) ? require(path) : {}

    if (!json.compilerOptions) {
      json.compilerOptions = {}
    }

    const directory = dirname(path)

    json.extends = './tsconfig.base.json'
    json.files = []
    json.include = ['src']
    json.compilerOptions =
      moduleType === 'esm'
        ? { outDir: relative(directory, ESM_BUILD_PATH), module: 'esnext', plugins: BASE_PLUGINS }
        : { outDir: relative(directory, CJS_BUILD_PATH), module: 'commonjs', plugins: BASE_PLUGINS }

    json.references = []
    json.exclude = EXCLUSIONS

    await writeFile(path, JSON.stringify(json, null, 2) + EOL)
  } catch (error) {
    console.error(`Build Config:`, error)

    throw error
  }
}
