import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import { builtinModules } from 'node:module'
import { EOL } from 'node:os'
import { dirname, join } from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'

import { Project } from 'ts-morph'

const virtualPrefixes = ['runtime', 'browser', 'entry', 'api', 'express']

const optionalPackagesNames = process.argv.slice(2)

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const packagesDir = join(root, 'packages')

const packageNames =
  optionalPackagesNames.length > 0
    ? optionalPackagesNames
    : fs
        .readdirSync(packagesDir)
        .filter((name) => fs.statSync(join(packagesDir, name)).isDirectory())

const readJson = (path: string) => JSON.parse(fs.readFileSync(path, 'utf-8').toString())

const rootPackageJson = readJson(join(root, 'package.json'))

const esmBultinModules = builtinModules.map((x) => `node:${x}`)

for (const name of packageNames) {
  console.log(`Updating ${name}...`)
  const packageDir = join(packagesDir, name)
  const srcDir = join(packageDir, 'src')
  const filePaths = getAllFilePaths(srcDir)
  const packageJson = readJson(join(packageDir, 'package.json'))
  const tsconfigJson = readJson(join(packageDir, 'tsconfig.json'))
  const project = new Project({ tsConfigFilePath: join(packageDir, 'tsconfig.json') })
  const dependencies = new Map<string, boolean /* importedFromTestFile */>()
  const references = new Set<string>()

  if (name === 'compiler') {
    dependencies.set('@rollup/pluginutils', false)
  }

  for (const path of filePaths) {
    const sourceFile = project.getSourceFile(path)

    if (!sourceFile) {
      continue
    }

    const filePath = sourceFile.getFilePath()
    const isTestFile = filePath.endsWith('.test.ts')
    const imports = sourceFile
      .getImportStringLiterals()
      .map((x) => x.getText().trim().slice(1).slice(0, -1))
      .filter((x) => !x.startsWith('.'))
      .sort()

    for (const importPath of imports) {
      const [orgName, packageName] = parsePackageName(importPath)
      const fullName = orgName ? `${orgName}/${packageName}` : packageName

      if (packageName === name) {
        continue
      }

      if (builtinModules.includes(fullName) || esmBultinModules.includes(fullName)) {
        dependencies.set('@types/node', true)
      } else {
        const current = dependencies.get(fullName)

        dependencies.set(fullName, !current ? isTestFile : false)

        if (orgName === '@typed') {
          references.add(packageName)
        }
      }
    }
  }

  if (!packageJson.private) {
    packageJson.publishConfig = {
      access: 'public',
    }
  }

  packageJson.sideEffects = false
  packageJson.dependencies = {}
  packageJson.devDependencies = {}

  packageJson.exports = {
    '.': {
      import: './dist/index.js',
      require: './dist/cjs/index.js',
      types: './dist/index.d.ts',
    },
    './*': {
      import: './dist/*.js',
      require: './dist/cjs/*.js',
      types: './dist/*.d.ts',
    },
  }

  for (const [dependency, testFile] of Array.from(dependencies).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    checkDependency(dependency, packageJson, testFile)
  }

  if (Object.keys(packageJson.dependencies).length === 0) {
    delete packageJson.dependencies
  }

  if (Object.keys(packageJson.devDependencies).length === 0) {
    delete packageJson.devDependencies
  }

  fs.writeFileSync(join(packageDir, 'package.json'), JSON.stringify(packageJson, null, 2) + EOL)

  tsconfigJson.references = Array.from(references)
    .sort()
    .map((name) => ({
      path: `../${name}/tsconfig.build.json`,
    }))

  fs.writeFileSync(join(packageDir, 'tsconfig.json'), JSON.stringify(tsconfigJson, null, 2) + EOL)

  const tsconfigCjsJsonPath = join(packageDir, 'tsconfig.cjs.build.json')

  if (fs.existsSync(tsconfigCjsJsonPath)) {
    const tsconfigCjsJSon = readJson(tsconfigCjsJsonPath)

    tsconfigCjsJSon.references = Array.from(references)
      .sort()
      .map((name) => ({
        path: `../${name}/tsconfig.cjs.build.json`,
      }))

    fs.writeFileSync(tsconfigCjsJsonPath, JSON.stringify(tsconfigCjsJSon, null, 2) + EOL)
  }
}

spawnSync('pnpm', ['install'], { stdio: 'inherit' })

function checkDependency(dependency: string, packageJson: any, testFile: boolean) {
  const version = findRootPackageVersion(dependency, testFile)

  if (
    version === null &&
    !dependency.startsWith('@typed') &&
    !virtualPrefixes.some((x) => dependency.startsWith(x))
  ) {
    throw new Error(
      `Could not find package version for ${dependency} in package ${packageJson.name}`,
    )
  }

  if (version) {
    const [versionString, depType] = version

    if (depType === 'dep') {
      packageJson.dependencies[dependency] = versionString

      const typesVersion = findRootPackageVersion(`@types/${dependency}`, false)

      if (typesVersion) {
        const [typesVersionString] = typesVersion

        packageJson.devDependencies[`@types/${dependency}`] = typesVersionString
      }
    } else {
      packageJson.devDependencies[dependency] = versionString
    }
  } else if (dependency.startsWith('@typed')) {
    if (testFile) {
      packageJson.devDependencies[dependency] = 'workspace:*'
    } else {
      packageJson.dependencies[dependency] = 'workspace:*'
    }
  }
}

function getAllFilePaths(directory: string): readonly string[] {
  const files = fs.readdirSync(directory)

  return files.flatMap((name) => {
    const path = join(directory, name)
    const stat = fs.statSync(path)

    if (stat.isDirectory()) {
      return getAllFilePaths(path)
    }

    return [path]
  })
}

function findRootPackageVersion(name: string, testFile: boolean) {
  const possibleNames = [name, name.split('/')[0]]

  for (const possibleName of possibleNames) {
    if (possibleName in rootPackageJson.dependencies) {
      return [
        rootPackageJson.dependencies[possibleName] as string,
        testFile ? 'devdep' : 'dep',
      ] as const
    } else if (possibleName in rootPackageJson.devDependencies) {
      return [rootPackageJson.devDependencies[possibleName] as string, 'devdep'] as const
    }
  }

  return null
}

function parsePackageName(importPath: string): readonly [string, string] {
  const [orgName, packageName = ''] = importPath.split(/\//g).map((x) => x.trim())

  if (packageName === '' || !orgName.startsWith('@')) {
    return ['', orgName]
  }

  return [orgName, packageName]
}
