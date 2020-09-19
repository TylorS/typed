import { spawnSync, SpawnSyncReturns } from 'child_process'
import { EOL } from 'os'

process.stdout.write(`Checking if 'ts-patch' is active...`)

const checkResult = spawnSync(`npx`, ['ts-patch', 'check'])

handleCheckOutput(checkResult, () => {
  process.stdout.write(EOL + `Attempting to install 'ts-patch'...`)

  return spawnSync(`npx`, ['ts-patch', 'install'])
})

function handleCheckOutput(
  result: SpawnSyncReturns<string>,
  install: () => SpawnSyncReturns<string>,
) {
  const isNotPatched =
    !!result.error || result.output.some((s) => s && s.toString().includes('is not patched'))

  if (isNotPatched) {
    process.stdout.write(` x` + EOL)

    const installResult = install()

    if (resultIsSuccess(installResult)) {
      process.stdout.write(` ✓` + EOL)

      return
    }

    console.error(EOL + `TypeScript has not been patched to compile with plugins.`)
    console.error(`Run the following and try again` + EOL)
    console.error(`    npx ts-patch install` + EOL)

    process.exit(1)
  }

  process.stdout.write(`✓` + EOL)
}

function resultIsSuccess(result: SpawnSyncReturns<string>) {
  if (result.error) {
    console.error(result.error)

    return false
  }

  return true
}
