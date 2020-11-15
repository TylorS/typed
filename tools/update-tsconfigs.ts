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
const CJS_BASE_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.cjs.json')
const ESM_BASE_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.esm.json')
const CJS_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../src/tsconfig.cjs.json')
const ESM_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../src/tsconfig.esm.json')
const SRC_DIR = join(ROOT_DIR, 'src')
const ESM_BUILD_PATH = join(ROOT_DIR, 'esm')
const CJS_BUILD_PATH = join(ROOT_DIR, 'cjs')

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

const DEFAULT_EXCLUSIONS_PATH = [
  'examples',
  'node_modules',
  'src/**/*.test.ts',
  'src/**/*.browser-test.ts',
  'tools',
  'cjs',
  'esm',
  'exports.js',
  'exports.d.ts',
  'exports.js.map',
  'exports.d.ts.map',
]

const NAME_REGEX = new RegExp('%name%', 'g')
const MODULE_TYPE_REGEX = new RegExp('%moduleType%', 'g')

const updatePluginConfigs = () =>
  Promise.all([
    updatePluginConfig(ESM_BASE_TSCONFIG_PATH, 'esm'),
    updatePluginConfig(CJS_BASE_TSCONFIG_PATH, 'cjs'),
  ]).then(() => process.stdout.write(EOL))

const updateBuildConfigs = () =>
  Promise.all<unknown>([
    updateBuildConfig(ESM_BUILD_TSCONFIG_PATH, 'esm'),
    updateBuildConfig(CJS_BUILD_TSCONFIG_PATH, 'cjs'),
  ]).then(() => process.stdout.write(EOL))

const updateModuleConfigs = () =>
  Promise.all(
    MODULES.map((name) =>
      Promise.all([updateModuleConfig(name, 'esm'), updateModuleConfig(name, 'cjs')]),
    ),
  ).then(() => process.stdout.write(EOL))

updatePluginConfigs()
  .then(updateBuildConfigs)
  .then(updateModuleConfigs)
  .catch((error) => {
    console.error(error)

    process.exit(1)
  })

async function updatePluginConfig(path: string, moduleType: ModuleType) {
  console.log(`Updating Plugin Config [${moduleType}]: ${path}`)

  const json = JSON.parse((await readFile(BASE_TSCONFIG_PATH)).toString())

  json.compilerOptions.plugins = [
    ...BASE_PLUGINS,
    createFpTsImportRewrite(moduleType),
    { ...createFpTsImportRewrite(moduleType), afterDeclarations: true },
  ]
  json.exclude = [...DEFAULT_EXCLUSIONS_PATH, ...MODULES.map((m) => `${m}`)]

  await writeFile(path, JSON.stringify(json, null, 2) + EOL)
}

async function updateBuildConfig(path: string, moduleType: ModuleType) {
  try {
    console.log(`Updating Build Config [${moduleType}]: ${path}`)

    const json = fs.existsSync(path) ? JSON.parse((await readFile(path)).toString()) : {}

    if (!json.compilerOptions) {
      json.compilerOptions = {}
    }

    const directory = dirname(path)
    const isInSrcDirectory = directory === SRC_DIR

    json.extends = relative(directory, BASE_TSCONFIG_PATH.replace('base', moduleType))
    json.files = []
    json.include = ['./exports.ts']
    json.compilerOptions =
      moduleType === 'esm'
        ? { outDir: relative(directory, ESM_BUILD_PATH), module: 'esnext' }
        : { outDir: relative(directory, CJS_BUILD_PATH), module: 'commonjs' }

    json.references = MODULES.map((name) => ({
      path: `${
        isInSrcDirectory ? `.` : relative(directory, SRC_DIR)
      }/${name}/tsconfig.${moduleType}.json`,
    }))

    await writeFile(path, JSON.stringify(json, null, 2) + EOL)
  } catch (error) {
    console.error(`Build Config:`, error)

    throw error
  }
}

function createFpTsImportRewrite(moduleType: ModuleType) {
  return {
    transform: 'ts-transformer-replace-paths',
    replaceImportPaths: {
      'fp-ts/(.+)': `fp-ts/${moduleType === 'cjs' ? 'lib' : 'es6'}/$1`,
      'io-ts/(.+)': `io-ts/${moduleType === 'cjs' ? 'lib' : 'es6'}/$1`,
    },
  }
}

async function updateModuleConfig(name: string, moduleType: ModuleType) {
  try {
    const directory = join(SRC_DIR, name)
    const configName = moduleType === void 0 ? `tsconfig.json` : `tsconfig.${moduleType}.json`
    const tsconfigJsonPath = join(directory, configName)

    console.log(
      `Updating Module Config [${moduleType ? `${moduleType}` : 'default'}]: @typed/fp/${name}`,
    )

    const tsconfigJson = JSON.parse(
      TSCONFIG_TEMPLATE.replace(MODULE_TYPE_REGEX, moduleType ? moduleType : '').replace(
        NAME_REGEX,
        name,
      ),
    )

    if (!tsconfigJson.compilerOptions) {
      tsconfigJson.compilerOptions = {}
    }

    tsconfigJson.compilerOptions = {
      ...tsconfigJson.compilerOptions,
      ...(moduleType === 'esm' ? { module: 'esnext' } : { module: 'commonjs' }),
    }

    tsconfigJson.references = findAllReferences(directory, moduleType, name)

    await writeFile(tsconfigJsonPath, JSON.stringify(tsconfigJson, null, 2) + EOL)
  } catch (error) {
    console.error(`${name}:`, error)

    throw error
  }
}

function findAllReferences(directory: string, moduleType: ModuleType, name: string) {
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

  return typedDependencyNames.map((name) => ({
    path: `../${name}/tsconfig.${moduleType}.json`,
  }))
}

function uniqStrings(strs: ReadonlyArray<string>) {
  return Array.from(new Set(strs)).sort()
}
