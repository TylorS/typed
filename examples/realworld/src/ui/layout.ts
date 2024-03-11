import { html } from "@typed/core"
import type { Fx, RenderEvent } from "@typed/core"
// import viteDevServer from "vavite/vite-dev-server"
// @ts-expect-error No Types YET
import assetManifest from "virtual:asset-manifest"

const manifestEntry = "src/client.ts"

export function layout<E, R>({ content }: {
  content: Fx.Fx<RenderEvent | null, E, R>
}) {
  const [type, as, src] = manifestEntry in assetManifest
    ? [undefined, "script", assetManifest[manifestEntry].file]
    : ["module", "module", manifestEntry.slice(4)]

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RealWorld</title>
        <link rel="preload" href="/${src}" as=${as} />
      </head>
      <body>
        <div id="app">${content}</div>
        <script type=${type} src="/${src}"></script>
      </body>
    </html>`
}
