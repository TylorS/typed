import * as dts from 'dts-bundle-generator'

const [filePath] = process.argv.slice(2)
const [typings] = dts.generateDtsBundle(
  [{ filePath, output: { inlineDeclareGlobals: true, inlineDeclareExternals: true } }],
  { followSymlinks: true },
)

process.stdout.write(typings)
