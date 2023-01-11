import { fileURLToPath } from 'url'

import express from 'express'
import staticGzip from 'express-static-gzip'

import { HtmlModule } from './HtmlModule.js'

export function addAssetDirectories(app: express.Express, modules: HtmlModule[], maxAge: number) {
  const assetDirectories = new Set<string>()

  // Register any assets that need to be served
  for (const mod of modules) {
    if (!mod.assetDirectory) continue

    const assetDirectory = fileURLToPath(new URL(mod.assetDirectory, import.meta.url))

    if (assetDirectories.has(assetDirectory)) continue

    assetDirectories.add(assetDirectory)

    app.use(
      // The vite plugin outputs .gz files, so we can serve them directly with
      // a tool like express-static-gzip
      staticGzip(assetDirectory, {
        serveStatic: { maxAge, cacheControl: true },
      }),
    )
  }
}