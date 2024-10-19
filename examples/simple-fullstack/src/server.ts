import type { Fx, RenderEvent } from "@typed/core"
import { html } from "@typed/core"
import * as Node from "@typed/core/Node"
import type { LayoutParams } from "@typed/core/Platform"
import { toServerRouter } from "@typed/core/Platform"
import { router } from "./app"

const layout = <Content extends Fx.Fx<RenderEvent | null, any, any>>({ content, script }: LayoutParams<Content>) =>
  html`<!doctype html>
<html>
  <head>
    <title>Simple Fullstack</title>
  </head>
  <body>
    ${content} 
    ${script}
  </body>
</html>`

toServerRouter(router, { layout, clientEntry: "browser" }).pipe(
  Node.listen({ port: 3000, serverDirectory: import.meta.dirname }),
  Node.run
)
