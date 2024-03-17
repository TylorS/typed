import { html } from "@typed/core"
import type { Fx, RenderEvent } from "@typed/core"
import type { LayoutParams } from "@typed/core/Platform"

export function layout<Content extends Fx.Fx<RenderEvent | null, any, any>>(
  { content, head, script }: LayoutParams<Content>
) {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="RealWorld Example App" />
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
