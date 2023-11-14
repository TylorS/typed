import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import type { CurrentEnvironment } from "@typed/environment"
import { RefSubject } from "@typed/fx"
import * as Fx from "@typed/fx/Fx"
import { render } from "@typed/template/Render"
import type { Renderable } from "@typed/template/Renderable"
import * as RenderContext from "@typed/template/RenderContext"
import { DomRenderEvent } from "@typed/template/RenderEvent"
import { html, RenderTemplate } from "@typed/template/RenderTemplate"
import type { TemplateInstance } from "@typed/template/TemplateInstance"
import { click, testRender } from "@typed/template/Test"
import * as Vitest from "@typed/template/Vitest"
import type * as Wire from "@typed/wire"
import { deepStrictEqual, ok } from "assert"
import type { NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Scope from "effect/Scope"
import * as happyDOM from "happy-dom"
import { describe, it } from "vitest"

export function tmpl<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
) {
  return RenderTemplate.withEffect((render) => render(template, values))
}

describe("Render", () => {
  Vitest.test("renders a simple template", () => {
    return Effect.gen(function*(_) {
      const { elementRef, window } = yield* _(testRender(html`<div>Hello, world!</div>`))
      const rendered = yield* _(elementRef)

      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })
  })

  it("renders a simple template with attributes", async () => {
    const test = testRendered(tmpl`<div class="foo" id="bar">Hello, world!</div>`, (rendered, window) => {
      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })

    await Effect.runPromise(test)
  })

  it("renders a nested templates", async () => {
    const test = testRendered(tmpl`<div class="foo" id="bar">Hello, world!</div>`, (rendered, window) => {
      ok(rendered instanceof window.HTMLDivElement)
      deepStrictEqual(rendered.className, "foo")
      deepStrictEqual(rendered.id, "bar")
      deepStrictEqual(rendered.innerText, "Hello, world!")
    })

    await Effect.runPromise(test)
  })

  Vitest.test("renders a counter", () => {
    const decrement = (x: number) => Math.max(0, x - 1)
    const increment = (x: number) => x + 1

    return Effect.gen(function*(_) {
      const count = yield* _(RefSubject.of(0))
      const rendered = yield* _(testRender(
        html`
        <button class="dec" onclick=${count.update(decrement)}>-</button>
        <p>${count}</p>
        <button class="inc" onclick=${count.update(increment)}>-</button>`
      ))

      const dec = click(rendered, { selector: ".dec" })
      const inc = click(rendered, { selector: ".inc" })

      yield* _(inc)
      yield* _(inc)
      yield* _(inc)
      yield* _(dec)
      yield* _(dec)
      yield* _(inc)
      yield* _(inc)
      yield* _(inc)

      expect(yield* _(count)).toEqual(4)
    })
  })
})

function makeWindow() {
  return new happyDOM.Window() as any as Window & typeof globalThis
}

type Provided = Document | RootElement | RenderContext.RenderContext | Scope.Scope | CurrentEnvironment

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
