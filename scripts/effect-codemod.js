const common = require('./common');
const { relative, join } = require('path');

const version = process.argv[2]

async function main() { 
  await import('zx/globals')

  const packages = (await Promise.all([common.readAllPackages(), common.readAllExamples()])).flat()

  await Promise.all(packages.map(async (pkg) => $([`pnpm effect-codemod ${version} "./${relative(process.cwd(), join(pkg.directory, 'src'))}"`])))
}

main().catch((e) => { 
  console.error(e)
  process.exit(1)
})
