import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { DomRenderEvent } from "@typed/template/RenderEvent"
import { html } from "@typed/template/RenderTemplate"
import type { Rendered } from "@typed/wire"
import { deepStrictEqual, ok } from "assert"
import * as Effect from "effect/Effect"
import * as happyDOM from "happy-dom"
import { describe, it } from "vitest"

describe("Render", () => {
  it("renders a simple template", async () => {
    await testRendered((rendered, window) => {
      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })
  })
})

function makeWindow() {
  return new happyDOM.Window() as any as Window & typeof globalThis
}

async function testRendered(f: (rendered: Rendered, window: Window & typeof globalThis) => void) {
  const window = makeWindow()
  const test = Effect.gen(function*(_) {
    const element = yield* _(html`<div>Hello, world!</div>`, Effect.flatMap((t) => t.get))

    f(element, window)

    return DomRenderEvent(element)
  }).pipe(
    render,
    Fx.first,
    Document.provide(window.document),
    RootElement.provide({ rootElement: window.document.body }),
    Effect.provide(RenderContext.browser),
    Effect.scoped
  )

  await Effect.runPromise(test)
}
