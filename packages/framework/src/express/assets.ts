import { fileURLToPath } from 'url'

import type express from 'express'
import staticGzip from 'express-static-gzip'

import type { HtmlModule } from '../HtmlModule.js'

export function assets(
  modules: HtmlModule[],
  options: staticGzip.ExpressStaticGzipOptions = {},
): Array<express.RequestHandler> {
  const assetDirectories = new Set<string>()
  const handlers: Array<express.RequestHandler> = []

  // Register any assets that need to be served
  for (const mod of modules) {
    const assetDirectory = fileURLToPath(new URL(mod.assetDirectory, import.meta.url))

    if (assetDirectories.has(assetDirectory)) continue

    assetDirectories.add(assetDirectory)

    // By Default, add support for .html files
    const defaultExtensions = ['html']
    const defaultSetHeaders: NonNullable<
      staticGzip.ExpressStaticGzipOptions['serveStatic']
    >['setHeaders'] = (res, path) => {
      // HTML files are served with a max-age of 0 so that they are always fresh
      if (path.endsWith('.html')) res.setHeader('Cache-Control', 'public, max-age=0')
    }

    const resolvedOptions: staticGzip.ExpressStaticGzipOptions = {
      ...options,
      serveStatic: {
        ...options.serveStatic,
        extensions: options.serveStatic?.extensions ?? defaultExtensions,
        setHeaders: options.serveStatic?.setHeaders ?? defaultSetHeaders,
      },
    }

    handlers.push(staticGzip(assetDirectory, resolvedOptions))
  }

  return handlers
}
