import { fileURLToPath } from 'url'

import type express from 'express'
import staticGzip from 'express-static-gzip'

import type { HtmlModule } from '../HtmlModule.js'

export function addAssetDirectories(
  app: express.Express,
  modules: HtmlModule[],
  options: staticGzip.ExpressStaticGzipOptions,
) {
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
      staticGzip(assetDirectory, options),
    )
  }
}
