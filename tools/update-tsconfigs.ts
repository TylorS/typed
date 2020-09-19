import * as fs from 'fs'
import { EOL } from 'os'
import { dirname, join, relative } from 'path'
import * as TSM from 'ts-morph'
import { promisify } from 'util'

import { findFilePaths, getRelativeFile, MODULES, readRelativeFile, ROOT_DIR } from './common'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

type ModuleType = 'esm' | 'cjs'

const TSCONFIG_TEMPLATE = readRelativeFile(__dirname, 'tsconfig-template.json')
const BASE_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.base.json')
const CJS_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../src/tsconfig.json')
const ESM_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../src/tsconfig.esm.json')
const SRC_DIR = join(ROOT_DIR, 'src')
const ENTRY_FILE = join(SRC_DIR, 'exports.ts')
const ESM_BUILD_PATH = join(ROOT_DIR, 'esm')
const CJS_BUILD_PATH = join(ROOT_DIR, 'cjs')

const DEFAULT_EXCLUSIONS_PATH = [
  './node_modules',
  './src/**/*.test.ts',
  './src/**/*.browser-test.ts',
  './tools',
  './cjs',
  './esm',
]

const NAME_REGEX = new RegExp('%name%', 'g')
const MODULE_TYPE_REGEX = new RegExp('%moduleType%', 'g')

updateBaseConfig()
  .then(() =>
    Promise.all([
      updateBuildConfg(ESM_BUILD_TSCONFIG_PATH, 'esm'),
      updateBuildConfg(CJS_BUILD_TSCONFIG_PATH, 'cjs'),
      ...MODULES.map((name) => updateTsConfig(name, 'esm')),
      ...MODULES.map((name) => updateTsConfig(name, 'cjs')),
    ]),
  )
  .catch(() => process.exit(1))

async function updateBaseConfig() {
  const json = JSON.parse((await readFile(BASE_TSCONFIG_PATH)).toString())

  json.exclude = [...DEFAULT_EXCLUSIONS_PATH, ...MODULES.map((m) => `./${m}`)]

  await writeFile(BASE_TSCONFIG_PATH, JSON.stringify(json, null, 2) + EOL)
}

async function updateBuildConfg(path: string, moduleType: ModuleType) {
  try {
    const {
      compilerOptions: { plugins: BASE_PLUGINS },
    } = JSON.parse(fs.readFileSync(BASE_TSCONFIG_PATH).toString())

    const json = fs.existsSync(path) ? JSON.parse((await readFile(path)).toString()) : {}

    if (!json.compilerOptions) {
      json.compilerOptions = {}
    }

    const directory = dirname(path)
    const isInSrcDirectory = directory === SRC_DIR

    json.extends = relative(directory, BASE_TSCONFIG_PATH)
    json.files = []
    json.includes = [isInSrcDirectory ? './exports.ts' : relative(directory, ENTRY_FILE)]
    json.compilerOptions =
      moduleType === 'esm'
        ? { outDir: relative(directory, ESM_BUILD_PATH), module: 'esnext' }
        : { outDir: relative(directory, CJS_BUILD_PATH), module: 'commonjs' }

    json.compilerOptions.plugins = [...BASE_PLUGINS, createFpTsImportRewrite(moduleType)]

    json.references = MODULES.map((name) => ({
      path: `${isInSrcDirectory ? `.` : relative(directory, SRC_DIR)}/${name}/tsconfig.${
        moduleType === 'esm' ? 'esm.' : ''
      }json`,
    }))

    await writeFile(path, JSON.stringify(json, null, 2) + EOL)
  } catch (error) {
    console.error(`Build Config:`, error)

    throw error
  }
}

function createFpTsImportRewrite(moduleType: ModuleType) {
  return {
    transform: 'ts-transform-import-path-rewrite',
    import: 'transform',
    alias: {
      '^fp-ts/(.+)': `fp-ts/${moduleType === 'cjs' ? 'lib' : 'es6'}/$1`,
    },
    after: true,
    type: 'config',
  }
}

async function updateTsConfig(name: string, moduleType: ModuleType) {
  try {
    const directory = join(SRC_DIR, name)
    const tsconfigJsonPath = join(
      directory,
      moduleType === 'cjs' ? `tsconfig.json` : `tsconfig.${moduleType}.json`,
    )
    const tsconfigJson = JSON.parse(
      TSCONFIG_TEMPLATE.replace(MODULE_TYPE_REGEX, moduleType).replace(NAME_REGEX, name),
    )

    tsconfigJson.compilerOptions = {
      ...tsconfigJson.compilerOptions,
      ...(moduleType === 'esm' ? { module: 'esnext' } : { module: 'commonjs' }),
    }

    tsconfigJson.references = findAllReferences(directory, name)

    await writeFile(tsconfigJsonPath, JSON.stringify(tsconfigJson, null, 2) + EOL)
  } catch (error) {
    console.error(`${name}:`, error)

    throw error
  }
}

function findAllReferences(directory: string, name: string) {
  const filePaths = findFilePaths(directory, ['*.ts', '**/*.ts'])
  const project = new TSM.Project({
    tsConfigFilePath: BASE_TSCONFIG_PATH,
    addFilesFromTsConfig: false,
  })

  const sourceFiles = project.addSourceFilesAtPaths(filePaths)
  const allDependencies = sourceFiles.flatMap((s) =>
    s.getImportDeclarations().map((l) => l.getModuleSpecifier().getText().replace(/'/g, '')),
  )
  const typedDependencies = uniqStrings(
    allDependencies.filter(
      (dep) => dep.includes('@typed/fp/') && !dep.includes(`@typed/fp/${name}`),
    ),
  )
  const typedDependencyNames = uniqStrings(
    typedDependencies.map((dep) => dep.replace('@typed/fp/', '').split('/')[0]),
  )

  return typedDependencyNames.map((name) => ({ path: `../${name}/tsconfig.json` }))
}

function uniqStrings(strs: ReadonlyArray<string>) {
  return Array.from(new Set(strs)).sort()
}
