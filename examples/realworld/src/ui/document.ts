import type { Fx, RenderEvent } from "@typed/core"
import { html } from "@typed/core"
import type { LayoutParams } from "@typed/core/Platform"

export const document = <Content extends Fx.Fx<RenderEvent | null, any, any>>(
  { content, script }: LayoutParams<Content>
) =>
  html`<!doctype html>
<html>
  <head>
    <title>Realworld</title>
  </head>
  <body>
    ${content} 
    ${script}
  </body>
</html>`
