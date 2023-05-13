/* eslint-disable */
const Fs = require("node:fs")
const Path = require("node:path")

function packages() {
  return Fs.readdirSync("packages").filter((_) =>
    Fs.existsSync(Path.join("packages", _, "docs/modules")),
  )
}

function pkgName(pkg) {
  return `@typed/${pkg}`
}

function copyFiles(pkg) {
  const name = pkgName(pkg)
  const docs = Path.join("packages", pkg, "docs/modules")
  const dest = Path.join("docs", pkg)
  const files = Fs.readdirSync(docs)

  for (const file of files) {
    const content = Fs.readFileSync(Path.join(docs, file), "utf8").replace(
      /^parent: Modules$/m,
      `parent: "${name}"`,
    )
    Fs.writeFileSync(Path.join(dest, file), content)
  }
}

function generateIndex(pkg, order) {
  const name = pkgName(pkg)
  const content = `---
title: "${name}"
has_children: true
permalink: /docs/${pkg}
nav_order: ${order}
---
`

  Fs.writeFileSync(Path.join("docs", pkg, "index.md"), content)
}

packages().forEach((pkg, i) => {
  Fs.rmSync(Path.join("docs", pkg), { recursive: true })
  Fs.mkdirSync(Path.join("docs", pkg), { recursive: true })
  copyFiles(pkg)
  generateIndex(pkg, i + 2)
})
