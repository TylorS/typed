import { html } from "@typed/core"
import type { Fx, RenderEvent } from "@typed/core"
import { getHeadAndScript } from "@typed/core/Vite"
import assetManifest from "virtual:asset-manifest"
import options from "virtual:typed-options"

const { head, script } = getHeadAndScript(options.clientEntry, assetManifest)

export function layout<E, R>({ content }: { content: Fx.Fx<RenderEvent | null, E, R> }) {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RealWorld</title>
        <base href="/" />
        ${head}
      </head>
      <body>
        <div id="app">${content}</div>
        ${script}
      </body>
    </html>`
}
