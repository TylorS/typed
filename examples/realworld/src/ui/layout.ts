import { html } from "@typed/core"
import type { Fx, RenderEvent, RenderQueue, RenderTemplate } from "@typed/core"
import type { Scope } from "effect"
import assetManifest from "virtual:asset-manifest"
import options from "virtual:typed-options"

export function layout<E, R>({ content }: {
  content: Fx.Fx<RenderEvent | null, E, R>
}): Fx.Fx<RenderEvent, never, R | RenderTemplate | RenderQueue.RenderQueue | Scope.Scope> {
  const { as, src, type } = getClientEntry()

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RealWorld</title>
        <link rel="preload" href=${src} as=${as} />
      </head>
      <body>
        <div id="app">${content}</div>
        <script type=${type} src=${src}></script>
      </body>
    </html>`
}

function getClientEntry() {
  const [type, as, src] = options.clientEntry in assetManifest
    ? [undefined, "script", assetManifest[options.clientEntry].file]
    : ["module", "module", options.clientEntry]

  return { type, as, src: src[0] === "/" ? src : `/${src}` } as const
}
