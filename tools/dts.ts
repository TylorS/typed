import { spawn } from 'child_process'
import { promises, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT_DIR = join(__dirname, '..')
const SOURCE_DIR = join(ROOT_DIR, 'src')

const modules = readdirSync(SOURCE_DIR).filter((x) => statSync(join(SOURCE_DIR, x)).isDirectory())

Promise.all(modules.map(generateDts)).catch((error) => {
  console.error(error)
  process.exitCode = 1
})

async function generateDts(moduleName: string) {
  const dts = await new Promise<string>((resolve) => {
    const entry = join(SOURCE_DIR, moduleName, 'index.ts')
    console.log(`Generating ${moduleName} DTS...`)

    const cp = spawn('npx', ['ts-node', join(ROOT_DIR, 'tools', 'generate-dts-bundle.ts'), entry], {
      stdio: 'pipe',
    })

    const chunks: string[] = []

    cp.stdout?.on('data', (b) => chunks.push(b.toString()))
    cp.on('close', () => resolve(chunks.join('')))
    cp.on('exit', () => resolve(chunks.join('')))
  })

  const outputFile = `${moduleName}/${moduleName}.d.ts`

  await promises.writeFile(outputFile, dts)

  console.log(`Generated ${moduleName} DTS!`)

  return dts
}
