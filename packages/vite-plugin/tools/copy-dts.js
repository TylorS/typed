/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path")
const fs = require("fs")

const rootDirectory = path.join(__dirname, "..")
const distDirectory = path.join(rootDirectory, "dist")

const fileNames = ["virtual-modules.d.ts"].map((fileName) => path.join(rootDirectory, fileName))

fileNames.forEach((fileName) => {
  fs.cpSync(fileName, path.join(distDirectory, path.basename(fileName)))
})

const packageJson = require(path.join(distDirectory, "package.json"))

packageJson.exports = {
  ...packageJson.exports,
  ...Object.fromEntries(
    fileNames.map((f) => path.basename(f)).map((f) => [`./${f.replace(".d.ts", "")}`, { types: `./${f}` }])
  )
}

fs.writeFileSync(path.join(distDirectory, "package.json"), JSON.stringify(packageJson, null, 2))
