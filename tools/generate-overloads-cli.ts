import { join } from 'path'

import { generateOverloads } from './generate-overloads'

const filePath = join(__dirname, 'overloads', process.argv[2])

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { signature } = require(filePath)

console.log(generateOverloads(signature))
