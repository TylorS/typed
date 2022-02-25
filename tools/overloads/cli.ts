import clipboard from 'clipboardy'
import { join } from 'path'
import { format } from 'prettier'
import yargs from 'yargs'

import { FunctionSignature, Interface } from './AST'
import { generateOverloads } from './generateOverloads'
import { printOverload } from './printOverload'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettierConfig = require('../../.prettierrc.cjs')

const program = yargs(process.argv, process.cwd()).option('definition', {
  alias: 'd',
  type: 'string',
  require: true,
})

const HKT_IMPORTS = `import {
  HKT,
  HKT2,
  HKT3,
  HKT4,
  HKT5,
  HKT6,
  HKT7,
  HKT8,
  HKT9,
  HKT10,
  Kind,
  Kind2,
  Kind3,
  Kind4,
  Kind5,
  Kind6,
  Kind7,
  Kind8,
  Kind9,
  Kind10,
  Params,
} from '@/Prelude/HKT'`

async function main() {
  const { definition } = await program.argv
  const filePath = join(
    __dirname,
    'definitions',
    definition.endsWith('.ts') ? definition : definition + '.ts',
  )
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { node } = require(filePath) as { node: FunctionSignature | Interface }

  console.log('Generating overloads...')
  const overloads = generateOverloads(node)
  const source =
    HKT_IMPORTS +
    '\n\n' +
    overloads.map(([overload, context]) => printOverload(overload, context)).join('\n\n')

  const output = format(source, prettierConfig) + '\n'

  console.log(output + '\n')

  await clipboard.write(output)

  console.log('Copied overload to your clipboard!')
}

main().catch((error) => {
  console.error(error)

  process.exitCode = 1
})
