import { join } from 'path'

import { generateOverloads } from './generate-overloads'

const overloadsPath = join(__dirname, 'overloads')
const filePaths = process.argv.slice(2).map((path) => join(overloadsPath, path))

filePaths.forEach((filePath, i) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { node } = require(filePath)

  if (i > 0) {
    console.log()
  }

  console.log(generateOverloads(node))

  if (i > 0) {
    console.log()
  }
})
