import * as fs from 'fs'
import { EOL } from 'os'
import { join } from 'path'
import * as TSM from 'ts-morph'
import { promisify } from 'util'

import {
  compiledFiles,
  findFilePaths,
  getRelativeFile,
  MODULES,
  readRelativeFile,
  ROOT_DIR,
  ROOT_FILES,
} from './common'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const TSCONFIG_TEMPLATE = readRelativeFile(__dirname, 'tsconfig-template.json')
const BASE_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.base.json')
const CJS_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.build.json')
const ESM_BUILD_TSCONFIG_PATH = getRelativeFile(__dirname, '../tsconfig.esm.json')
const SRC_DIR = join(ROOT_DIR, 'src')

const DEFAULT_EXCLUSIONS = [
  './node_modules',
  './src/**/*.test.ts',
  './src/**/*.browser-test.ts',
  './tools',
]
const NAME_REGEX = new RegExp('%name%', 'g')
const MODULE_TYPE_REGEX = new RegExp('%moduleType%', 'g')

Promise.all([
  updateBuildConfg(ESM_BUILD_TSCONFIG_PATH, { outDir: './esm', module: 'esnext' }),
  updateBuildConfg(CJS_BUILD_TSCONFIG_PATH, { outDir: './cjs', module: 'CommonJS' }),
  ...MODULES.map((name) => updateTsConfig(name, 'esm')),
  ...MODULES.map((name) => updateTsConfig(name, 'cjs')),
]).catch(() => process.exit(1))

async function updateBuildConfg(path: string, compilerOptions: {}) {
  try {
    const json = fs.existsSync(path) ? JSON.parse((await readFile(path)).toString()) : {}

    if (!json.compilerOptions) {
      json.compilerOptions = {}
    }

    json.extends = './tsconfig.base.json'
    json.compilerOptions = { ...json.compilerOptions, ...compilerOptions }

    const outDir = json.compilerOptions.outDir

    json.exclude = [
      ...DEFAULT_EXCLUSIONS,
      ...ROOT_FILES.flatMap((file) => compiledFiles(file).map((path) => join(outDir, path))),
      ...MODULES.map((m) => join(outDir, m)),
    ]

    json.references = MODULES.map((name) => ({ path: `./src/${name}/tsconfig.json` }))

    await writeFile(path, JSON.stringify(json, null, 2) + EOL)
  } catch (error) {
    console.error(`Build Config:`, error)

    throw error
  }
}

async function updateTsConfig(name: string, moduleType: 'esm' | 'cjs') {
  try {
    const directory = join(SRC_DIR, name)
    const tsconfigJsonPath = join(
      directory,
      moduleType === 'cjs' ? `tsconfig.json` : `tsconfig.${moduleType}.json`,
    )
    const tsconfigJson = JSON.parse(
      TSCONFIG_TEMPLATE.replace(MODULE_TYPE_REGEX, moduleType).replace(NAME_REGEX, name),
    )

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
