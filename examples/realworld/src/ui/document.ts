import { layout } from "@/ui/layout"
import { html } from "@typed/core"
import type { Fx, RenderEvent } from "@typed/core"
import type { LayoutParams } from "@typed/core/Platform"

export function document<Content extends Fx.Fx<RenderEvent | null, any, any>>(
  { content, head, script }: LayoutParams<Content>
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
        <link
          href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic"
          rel="stylesheet"
          type="text/css"
        />
        <link rel="stylesheet" type="text/css" href="https://demo.productionready.io/main.css" />
        <base href="/" />
        ${head}
      </head>
      <body>
        <div id="app">${layout(content)}</div>
        ${script}
      </body>
    </html>`
}
