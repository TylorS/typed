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
  const paths = packages.map(({ name }) => makePackagePath(name)).reduce((acc, x) => ({ ...acc, ...x }), {})
  const madePaths = packages.map(({ name }) => makeMadgePath(name)).reduce((acc, x) => ({ ...acc, ...x }), {})
  const tsconfigBaseJson = await FS.promises.readFile(BASE_TSCONFIG_JSON, "utf8").then(JSON.parse)
  const tsconfigMadgeJson = await FS.promises.readFile(MADGE_TSCONFIG_JSON, "utf8").then(JSON.parse)
  
  tsconfigBaseJson.compilerOptions.paths = paths
  tsconfigMadgeJson.compilerOptions.paths = madePaths
  tsconfigMadgeJson.include = packages.flatMap(({ name }) => [`packages/${name}/build/esm/**/*`, `packages/${name}/build/test/**/*`, `packages/${name}/build/examples/**/*`])

  await Promise.all([
    FS.promises.writeFile(BASE_TSCONFIG_JSON, JSON.stringify(tsconfigBaseJson, null, 2) + EOL),
    FS.promises.writeFile(MADGE_TSCONFIG_JSON, JSON.stringify(tsconfigMadgeJson, null, 2) + EOL)
  ])
}

function makePackagePath(name) {
  return {
    [`@typed/${name}`]: [`packages/${name}/src/index.ts`],
    [`@typed/${name}/*`]: [`packages/${name}/src/*`],
    [`@typed/${name}/test/*`]: [`packages/${name}/test/*`],
    [`@typed/${name}/examples/*`]: [`packages/${name}/examples/*`],
  }
}

function makeMadgePath(name) {
  return {
    [`@typed/${name}`]: [`packages/${name}/build/esm/index.js`],
    [`@typed/${name}/*`]: [`packages/${name}/build/esm/*`],
    [`@typed/${name}/test/*`]: [`packages/${name}/build/test/*`],
    [`@typed/${name}/examples/*`]: [`packages/${name}/build/examples/*`],
  }
}

