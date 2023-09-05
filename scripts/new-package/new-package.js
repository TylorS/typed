const cac = require("cac")
const FS = require("node:fs")
const Path = require("node:path")

const { options } = cac('[name]').parse()

const name = options.name.replace(/\s/g, "-").toLowerCase()
const fileDirectory = Path.join(__dirname, 'files')
const rootDirectory = Path.join(__dirname, '../..')
const packageDirectory = Path.join(rootDirectory, 'packages', options.name)

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function main() { 
  console.log(`Creating new package ${name}...`)

  // Create package directory
  await FS.promises.mkdir(packageDirectory, { recursive: true })

  // Copy over files
  await Promise.all(readAllFiles(fileDirectory, packageDirectory).map(copyFile))

  // Make src + test directories
  await FS.promises.mkdir(Path.join(packageDirectory, 'src'), { recursive: true })
  await FS.promises.mkdir(Path.join(packageDirectory, 'test'), { recursive: true })

  console.log(`New package ${name} created!`)
}

async function copyFile(file) { 
  const { absolutePath, isTemplate, outPath } = file
  let content = await FS.promises.readFile(absolutePath, "utf8")

  if (isTemplate) { 
    content = content.replace(/\{\{\s?name\s?\}\}/gi, name)
  }

  await FS.promises.writeFile(outPath, content)
}

function readAllFiles(fileDir, outDir) { 
  return FS.readdirSync(fileDir, { recursive: true }).map(relativePath => ({
    relativePath,
    absolutePath: Path.join(fileDir, relativePath),
    isTemplate: relativePath.endsWith('.template'),
    outPath: Path.join(outDir, relativePath.endsWith('.template') ? relativePath.replace('.template', '') : relativePath),
  }))
}
