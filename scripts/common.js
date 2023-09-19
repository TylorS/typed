/* eslint-disable */

const FS = require("node:fs")
const Path = require("node:path")

exports.ROOT_DIRECTORY = Path.join(__dirname, "..")
exports.PACKAGES_DIRECTORY = Path.join(exports.ROOT_DIRECTORY, "packages")
exports.EXAMPLES_DIRECTORY = Path.join(exports.ROOT_DIRECTORY, "examples")

exports.readAllPackageNames = async function readAllPackageNames() {
  const dir = await FS.promises.readdir(exports.PACKAGES_DIRECTORY, { withFileTypes: true })
    
  return dir
    .filter((_) => _.isDirectory())
    .map((_) => _.name)
    .filter((_) => _ !== 'tsconfig')
}

exports.readAllExampleNames = async function readAllExampleNames() {
  const dir = await FS.promises.readdir(exports.EXAMPLES_DIRECTORY, { withFileTypes: true })
    
  return dir
    .filter((_) => _.isDirectory())
    .map((_) => _.name)
}

exports.readAllPackages = async function readAllPackages() { 
  const names = await exports.readAllPackageNames()
  const pkgs = await Promise.all(names.map(async (name) => { 
    const directory = Path.join(exports.PACKAGES_DIRECTORY, name)
    const [packageJson, tsconfigJson, tsconfigBuildJson, tsconfigTestJson, tsconfigExamplesJson] = await Promise.all([
      exports.readJsonFile(Path.join(directory, 'package.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.build.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.test.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.examples.json')),
    ])

    return {
      example: false,
      name,
      directory,
      packageJson,
      tsconfigJson,
      tsconfigBuildJson,
      tsconfigTestJson,
      tsconfigExamplesJson,
    }
  }))

  return pkgs
}

exports.readAllExamples = async function readAllExamples() { 
  const names = await exports.readAllExampleNames()
  const pkgs = await Promise.all(names.map(async (name) => { 
    const directory = Path.join(exports.EXAMPLES_DIRECTORY, name)
    const [packageJson, tsconfigJson, tsconfigBuildJson, tsconfigTestJson, tsconfigExamplesJson] = await Promise.all([
      exports.readJsonFile(Path.join(directory, 'package.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.build.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.test.json')),
      exports.readJsonFile(Path.join(directory, 'tsconfig.examples.json')),
    ])

    return {
      example: true,
      name,
      directory,
      packageJson,
      tsconfigJson,
      tsconfigBuildJson,
      tsconfigTestJson,
      tsconfigExamplesJson,
    }
  }))

  return pkgs
}

exports.readJsonFile = async function readJsonFile(path) { 
  try {
    const content = await FS.promises.readFile(path).then((_) => _.toString())

    return {
      path,
      content: JSON.parse(content)
    }
  } catch (e) {
    throw new Error(`Failed to read JSON file at ${path}`, {cause: e})
  }
}
