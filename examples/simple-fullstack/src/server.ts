import { type Fx, html, type RenderEvent } from "@typed/core"
import * as Node from "@typed/core/Node"
import { type LayoutParams, toServerRouter } from "@typed/core/Platform"
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
