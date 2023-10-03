const { ROOT_DIRECTORY, readAllPackages } = require("./common")
const Path = require("node:path")
const FS = require("node:fs")
const { EOL } = require("node:os")

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

const BASE_TSCONFIG_JSON = Path.join(ROOT_DIRECTORY, "tsconfig.base.json")
const MADGE_TSCONFIG_JSON = Path.join(ROOT_DIRECTORY, "tsconfig.madge.json")

async function main() {
  const packages = await readAllPackages()
  const testPaths = 
    {
      "@/test/*": ["./test/*"],
    }
  const paths = packages.map(({ example, name }) => makePackagePath(example, name)).reduce((acc, x) => ({ ...acc, ...x }), testPaths)
  const madgePaths = packages.map(({ example, name }) => makeMadgePath(example, name)).reduce((acc, x) => ({ ...acc, ...x }), testPaths)
  const tsconfigBaseJson = await FS.promises.readFile(BASE_TSCONFIG_JSON, "utf8").then(JSON.parse)
  const tsconfigMadgeJson = await FS.promises.readFile(MADGE_TSCONFIG_JSON, "utf8").then(JSON.parse)

  tsconfigBaseJson.compilerOptions.paths = paths
  tsconfigMadgeJson.compilerOptions.paths = madgePaths
  tsconfigMadgeJson.include = packages.flatMap(({ name }) => [`packages/${name}/build/esm/**/*`, `packages/${name}/build/test/**/*`, `packages/${name}/build/examples/**/*`])

  await Promise.all([
    FS.promises.writeFile(BASE_TSCONFIG_JSON, JSON.stringify(tsconfigBaseJson, null, 2) + EOL),
    FS.promises.writeFile(MADGE_TSCONFIG_JSON, JSON.stringify(tsconfigMadgeJson, null, 2) + EOL)
  ])
}

function makePackagePath(example, name) {
  return {
    [`@typed/${name}`]: [`${exampleOrPackagePath(example)}/${name}/src/index.ts`],
    [`@typed/${name}/*`]: [`${exampleOrPackagePath(example)}/${name}/src/*`],
    [`@typed/${name}/test/*`]: [`${exampleOrPackagePath(example)}/${name}/test/*`],
    [`@typed/${name}/examples/*`]: [`${exampleOrPackagePath(example)}/${name}/examples/*`],
  }
}

function makeMadgePath(example, name) {
  return {
    [`@typed/${name}`]: [`${exampleOrPackagePath(example)}/${name}/build/esm/index.js`],
    [`@typed/${name}/*`]: [`${exampleOrPackagePath(example)}/${name}/build/esm/*`],
    [`@typed/${name}/test/*`]: [`${exampleOrPackagePath(example)}/${name}/build/test/*`],
    [`@typed/${name}/examples/*`]: [`${exampleOrPackagePath(example)}/${name}/build/examples/*`],
  }
}

function exampleOrPackagePath(example) {
  return example ? `examples` : `packages` 
}
