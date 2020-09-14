import fs from 'fs'
import { join } from 'path'
import TSM from 'ts-morph'
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

const TSCONFIG_TEMPLATE = readRelativeFile(import.meta, 'tsconfig-template.json')
const BASE_TSCONFIG_PATH = getRelativeFile(import.meta, '../tsconfig.base.json')
const BUILD_TSCONFIG_PATH = getRelativeFile(import.meta, '../tsconfig.build.json')
const SRC_DIR = join(ROOT_DIR, 'src')

Promise.all([updateBuildConfg(), ...MODULES.map(updateTsConfig)]).catch(() => process.exit(1))

async function updateBuildConfg() {
  try {
    const json = JSON.parse((await readFile(BUILD_TSCONFIG_PATH)).toString())

    json.exclude = [
      './node_modules',
      './src/**/*.test.ts',
      './src/**/*.browser-test.ts',
      ...ROOT_FILES.flatMap(compiledFiles),
      ...MODULES.map((m) => `./${m}/`),
    ]
    json.references = MODULES.map((name) => ({ path: `./src/${name}/tsconfig.json` }))

    await writeFile(BUILD_TSCONFIG_PATH, JSON.stringify(json, null, 2))
  } catch (error) {
    console.error(`Build Config:`, error)

    throw error
  }
}

async function updateTsConfig(name: string) {
  try {
    const directory = join(SRC_DIR, name)
    const tsconfigJsonPath = join(directory, 'tsconfig.json')
    const tsconfigJson = JSON.parse(TSCONFIG_TEMPLATE)

    tsconfigJson.compilerOptions.outDir = tsconfigJson.compilerOptions.outDir.replace(
      '%name%',
      name,
    )
    tsconfigJson.references = findAllReferences(directory, name)

    await writeFile(tsconfigJsonPath, JSON.stringify(tsconfigJson, null, 2))
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
