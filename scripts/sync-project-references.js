const { ROOT_DIRECTORY, readAllPackages, readAllExamples, readJsonFile } = require("./common")
const Path = require("node:path")
const FS = require("node:fs")
const { EOL } = require("node:os")

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function main() {
  const pkgs = await readAllPackages()
  const examples = await readAllExamples()
  const packages = [...pkgs, ...examples]

  await Promise.all([
    updateRootReferences(pkgs),
    ...packages.map(updateProjectReferences),
  ])
}

async function updateRootReferences(packages) { 
  const [buildJson, tsconfigJson] = await Promise.all([readJsonFile(Path.join(ROOT_DIRECTORY, 'tsconfig.build.json')), readJsonFile(Path.join(ROOT_DIRECTORY, 'tsconfig.json'))])

  buildJson.content.references = packages.map(({ example, name }) => ({ path: `${example ? `examples` : `packages`}/${name}` }))
  tsconfigJson.content.references = packages.map(({ example, name }) => ({ path: `${example ? `examples` : `packages`}/${name}` }))

  await Promise.all([
    FS.promises.writeFile(buildJson.path, JSON.stringify(buildJson.content, null, 2) + EOL),
    FS.promises.writeFile(tsconfigJson.path, JSON.stringify(tsconfigJson.content, null, 2) + EOL),
  ])
}

async function updateProjectReferences({ example, name, packageJson, tsconfigBuildJson }) {
  console.log(`Updating project references for @typed/${name}...`)

  const typedReferences = findTypedReferencesFromPackageJson(packageJson)
  
  await updateTsConfigWithRefrences(tsconfigBuildJson, typedReferences, example)

  console.log(`Updated project references for @typed/${name}!`)
}

async function updateTsConfigWithRefrences(tsconfigJson, references, example) {
  if (references.length === 0) return

  const { path,  content } = tsconfigJson

  content.references = references.map((name) => ({ path: example ? `../../packages/${name}` : `../${name}` }))

  await FS.promises.writeFile(path, JSON.stringify(content, null, 2) + EOL)
}

function findTypedReferencesFromPackageJson(packageJson) { 
  const { content } = packageJson

  if (!content) return []

  const { dependencies, devDependencies, peerDependencies } = content
  const allDependencies = { ...dependencies, ...devDependencies, ...peerDependencies }

  return Object.entries(allDependencies)
    .filter(([name, version]) => name.startsWith('@typed/') && version === 'workspace:*')
    .map(([name]) => name.replace('@typed/', ''))
    .filter((_) => _ !== 'vite-plugin-types')
}
