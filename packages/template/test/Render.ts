import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { DomRenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { html } from "@typed/template/RenderTemplate"
import type { TemplateInstance } from "@typed/template/TemplateInstance"
import type * as Wire from "@typed/wire"
import { deepStrictEqual, ok } from "assert"
import type { NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Scope from "effect/Scope"
import * as happyDOM from "happy-dom"
import { describe, it } from "vitest"

describe("Render", () => {
  it("renders a simple template", async () => {
    const test = testRendered(html`<div>Hello, world!</div>`, (rendered, window) => {
      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })

    await Effect.runPromise(test)
  })

  it("renders a simple template with attributes", async () => {
    const test = testRendered(html`<div class="foo" id="bar">Hello, world!</div>`, (rendered, window) => {
      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })

    await Effect.runPromise(test)
  })

  it("renders a nested templates", async () => {
    const test = testRendered(html`<div class="foo" id="bar">Hello, world!</div>`, (rendered, window) => {
      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })

    await Effect.runPromise(test)
  })
})

function makeWindow() {
  return new happyDOM.Window() as any as Window & typeof globalThis
}

type Provided = Document | RootElement | RenderContext.RenderContext | Scope.Scope

function testRendered<R, E, A extends Wire.Rendered>(
  template: Effect.Effect<R, never, TemplateInstance<E, A>>,
  f: (rendered: Wire.Rendered, window: Window & typeof globalThis) => void
): Effect.Effect<Exclude<Exclude<R, RenderTemplate>, Provided>, E | NoSuchElementException, void> {
  const window = makeWindow()
  const scope = Effect.runSync(Scope.make())
  const layer = Layer.mergeAll(
    Document.layer(Effect.succeed(window.document)),
    RootElement.layer(Effect.succeed({ rootElement: window.document.body })),
    RenderContext.browser,
    Layer.succeed(Scope.Scope, scope)
  )

  return Effect.gen(function*(_) {
    const element = yield* _(template, Effect.flatten)

    f(element, window)

    return DomRenderEvent(element)
  }).pipe(
    Fx.fromEffect,
    render,
    Fx.drain,
    Effect.provide(layer)
  )
}
