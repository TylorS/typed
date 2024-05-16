import { html } from "@typed/core"
import type { Fx, RenderEvent } from "@typed/core"
import type { LayoutParams } from "@typed/core/Platform"
import { layout } from "@typed/realworld/ui/layout"

export function document<E, R>(
  { content, head, script }: LayoutParams<Fx.Fx<RenderEvent | null, E, R>>
) {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Conduit</title>
        <meta name="description" content="RealWorld Example App" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://code/iconicframework.com" >
        <link rel="preconnect" href="https://fonts.googleapis.com" >
        <base href="/" />
        ${head}
      </head>
      <body>
        <div id="app">${layout<E, R>(content)}</div>
        ${script}
      </body>
    </html>`
}
